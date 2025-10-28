CREATE TABLE IF NOT EXISTS t_p28942620_humster_kombat_proje.player_progress (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) UNIQUE NOT NULL,
    coins BIGINT DEFAULT 0,
    energy INTEGER DEFAULT 1000,
    max_energy INTEGER DEFAULT 1000,
    profit_per_hour INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    tap_power INTEGER DEFAULT 1,
    upgrades JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_id ON t_p28942620_humster_kombat_proje.player_progress(player_id);