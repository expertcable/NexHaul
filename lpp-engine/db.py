import os
from typing import List, Dict, Any
import psycopg2
from psycopg2.errors import LockNotAvailable, OperationalError
from psycopg2.extras import RealDictCursor

# Connect to local PostgreSQL database (placeholder password as requested, with env fallback)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://expertcable:YOUR_PASSWORD@localhost:5432/truck_backhaul_matcher"
)

def get_db_connection():
    """Returns a new psycopg2 database connection."""
    return psycopg2.connect(DATABASE_URL)

def claim_loads_pessimistic(load_ids: List[str], truck_id: str) -> Dict[str, Any]:
    """
    Opens a SQL transaction and claims loads using pessimistic row-level locking
    with FOR UPDATE NOWAIT to prevent race conditions during continuous-move LPP matching.
    
    Note on Schema Alignment: In our Prisma schema enum LoadStatus, the status values are
    'OPEN' (displayed in UI as 'OPEN FOR MATCHING') and 'MATCHED' (displayed as 'LPP OPTIMIZED').
    We query against 'OPEN' and update to 'MATCHED' to prevent PostgreSQL enum type errors.
    """
    if not load_ids:
        return {"success": False, "error": "No load IDs provided", "claimed_ids": []}

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Lock rows immediately without waiting (pessimistic lock)
            # If another solver or worker holds a lock, raises LockNotAvailable immediately
            lock_query = """
                SELECT id, "originCity", "destCity", "weightKg"
                FROM "Load"
                WHERE id IN %s AND "status" = 'OPEN'
                FOR UPDATE NOWAIT;
            """
            cur.execute(lock_query, (tuple(load_ids),))
            locked_rows = cur.fetchall()
            
            found_ids = [row["id"] for row in locked_rows]
            
            # Check if all requested loads are actually OPEN and available
            if len(found_ids) < len(load_ids):
                missing_ids = set(load_ids) - set(found_ids)
                conn.rollback()
                return {
                    "success": False,
                    "error": f"Some loads are no longer OPEN or do not exist in candidate pool: {list(missing_ids)}",
                    "claimed_ids": [],
                    "truck_id": truck_id
                }

            # 2. Update the status of the claimed loads to MATCHED ('LPP OPTIMIZED')
            update_query = """
                UPDATE "Load"
                SET "status" = 'MATCHED', "updatedAt" = NOW()
                WHERE id IN %s;
            """
            cur.execute(update_query, (tuple(found_ids),))
            
            # Commit transaction to release locks and finalize state
            conn.commit()

            return {
                "success": True,
                "claimed_ids": found_ids,
                "truck_id": truck_id,
                "status": "LPP OPTIMIZED",
                "message": f"Successfully claimed and locked {len(found_ids)} load(s) for truck {truck_id}."
            }

    except LockNotAvailable:
        if conn:
            conn.rollback()
        return {
            "success": False,
            "error": "LockNotAvailable: One or more requested loads are currently locked by a competing LPP optimization transaction.",
            "claimed_ids": [],
            "truck_id": truck_id
        }
    except Exception as e:
        if conn:
            conn.rollback()
        return {
            "success": False,
            "error": f"Database error during pessimistic load claim: {str(e)}",
            "claimed_ids": [],
            "truck_id": truck_id
        }
    finally:
        if conn:
            conn.close()
