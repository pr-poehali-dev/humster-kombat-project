import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Claim daily reward for player
    Args: event with httpMethod, body (player_id)
    Returns: HTTP response with reward amount and new streak
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
        SELECT coins, last_daily_reward, daily_streak
        FROM t_p28942620_humster_kombat_proje.player_progress
        WHERE player_id = %s
    """, (player_id,))
    
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Player not found'})
        }
    
    current_coins, last_reward, streak = row
    now = datetime.utcnow()
    
    if last_reward:
        time_since_last = now - last_reward
        if time_since_last < timedelta(hours=24):
            time_left = timedelta(hours=24) - time_since_last
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Already claimed today',
                    'time_left_seconds': int(time_left.total_seconds())
                })
            }
        
        if time_since_last > timedelta(hours=48):
            streak = 0
    
    new_streak = (streak or 0) + 1
    base_reward = 5000
    streak_bonus = min(new_streak - 1, 6) * 1000
    total_reward = base_reward + streak_bonus
    new_coins = current_coins + total_reward
    
    cur.execute("""
        UPDATE t_p28942620_humster_kombat_proje.player_progress
        SET coins = %s,
            last_daily_reward = %s,
            daily_streak = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE player_id = %s
    """, (new_coins, now, new_streak, player_id))
    
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
        'body': json.dumps({
            'success': True,
            'reward': total_reward,
            'new_streak': new_streak,
            'new_coins': new_coins
        })
    }
