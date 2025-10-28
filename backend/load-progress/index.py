import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Load player progress from database
    Args: event with httpMethod, queryStringParameters (player_id)
    Returns: HTTP response with player progress data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    player_id = params.get('player_id')
    
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
        SELECT coins, energy, max_energy, profit_per_hour, level, tap_power, upgrades, tasks
        FROM t_p28942620_humster_kombat_proje.player_progress
        WHERE player_id = %s
    """, (player_id,))
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'found': False,
                'data': {
                    'coins': 0,
                    'energy': 1000,
                    'max_energy': 1000,
                    'profit_per_hour': 0,
                    'level': 1,
                    'tap_power': 1,
                    'upgrades': [],
                    'tasks': []
                }
            })
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'found': True,
            'data': {
                'coins': row[0],
                'energy': row[1],
                'max_energy': row[2],
                'profit_per_hour': row[3],
                'level': row[4],
                'tap_power': row[5],
                'upgrades': row[6],
                'tasks': row[7]
            }
        })
    }
