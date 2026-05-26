-- Party Tables
CREATE TABLE parties (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    leader_user_id VARCHAR(36),
    max_member_count INTEGER DEFAULT 6,
    status VARCHAR(20) DEFAULT 'RECRUITING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (leader_user_id) REFERENCES users(id)
);

CREATE TABLE party_members (
    party_id VARCHAR(36) NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'MEMBER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (party_id, user_id)
);

CREATE TABLE party_invites (
    invite_code VARCHAR(36) PRIMARY KEY NOT NULL,
    party_id VARCHAR(36) NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    created_by VARCHAR(36) REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_count INTEGER DEFAULT 0,
    max_use_count INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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