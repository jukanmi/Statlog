-- Party Tables
CREATE TABLE parties (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE party_members (
    party_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (party_id, user_id),
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
);

CREATE TABLE party_invites (
    invite_code VARCHAR(36) PRIMARY KEY,
    party_id VARCHAR(36) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
);

-- Avatar (도감) Tables
CREATE TABLE avatars (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(1000),
    silhouette_image_url VARCHAR(1000) NOT NULL
);

CREATE TABLE user_avatars (
    user_id VARCHAR(36) NOT NULL,
    avatar_id VARCHAR(36) NOT NULL,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, avatar_id),
    FOREIGN KEY (avatar_id) REFERENCES avatars(id) ON DELETE CASCADE
);