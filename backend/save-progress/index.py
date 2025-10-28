import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Save player progress to database
    Args: event with httpMethod, body (player_id, coins, energy, etc.)
    Returns: HTTP response with success status
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    player_id = body_data.get('player_id')
    coins = body_data.get('coins', 0)
    energy = body_data.get('energy', 1000)
    max_energy = body_data.get('max_energy', 1000)
    profit_per_hour = body_data.get('profit_per_hour', 0)
    level = body_data.get('level', 1)
    tap_power = body_data.get('tap_power', 1)
    upgrades = json.dumps(body_data.get('upgrades', []))
    tasks = json.dumps(body_data.get('tasks', []))
    completed_tasks = json.dumps(body_data.get('completed_tasks', []))
    
    if not player_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'player_id is required'})
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO t_p28942620_humster_kombat_proje.player_progress 
        (player_id, coins, energy, max_energy, profit_per_hour, level, tap_power, upgrades, tasks, completed_tasks, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (player_id) 
        DO UPDATE SET 
            coins = EXCLUDED.coins,
            energy = EXCLUDED.energy,
            max_energy = EXCLUDED.max_energy,
            profit_per_hour = EXCLUDED.profit_per_hour,
            level = EXCLUDED.level,
            tap_power = EXCLUDED.tap_power,
            upgrades = EXCLUDED.upgrades,
            tasks = EXCLUDED.tasks,
            completed_tasks = EXCLUDED.completed_tasks,
            updated_at = CURRENT_TIMESTAMP
    """, (player_id, coins, energy, max_energy, profit_per_hour, level, tap_power, upgrades, tasks, completed_tasks))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'success': True, 'message': 'Progress saved'})
    }