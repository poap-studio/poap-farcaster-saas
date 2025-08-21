#!/bin/bash

# Function to add env var to all environments
add_env_var() {
    local name=$1
    local value=$2
    echo "Adding $name..."
    echo "$value" | vercel env add "$name" production
    echo "$value" | vercel env add "$name" preview
    echo "$value" | vercel env add "$name" development
}

# Add all environment variables
add_env_var "NEXT_PUBLIC_INFURA_PROJECT_ID" "f5ca55aaf5164a15852e1beaec07a956"
add_env_var "DATABASE_URL" "postgresql://postgres:POAPFarcaster2024!@poap-farcaster-db.cuayvp8dpvrg.us-east-1.rds.amazonaws.com:5432/postgres"
add_env_var "NEXT_PUBLIC_NEYNAR_API_KEY" "0EF1C69D-A690-4775-B247-EBFAAD885C5A"
add_env_var "NEXT_PUBLIC_FRAME_URL" "https://poap-farcaster-saas-zeta.vercel.app/"
add_env_var "POAP_API_KEY" "doJbd1DdLFG3q6lE1o22LOzfpFYmIkcN1n7ataBYtBgQ7RaA9XfZ1vpyXmjs8lWHPJ36t4GKSHQnfLrPwbouzl87Zh5dICQd9gnHvAf5ngxraPonAj4BizSs7uMwvLyl"
add_env_var "POAP_CLIENT_ID" "x9wYXDc3HY6HONCqHuHk1MSCxcxb8j3y"
add_env_var "POAP_CLIENT_SECRET" "JybIHlU1xZQyjNO6Tzq4QdzTPFITfxAyKMb3_EFlIV_jEcD7F8R1-Ruf7SJ3T0wl"
add_env_var "JWT_SECRET" "7f4d3e2a9b8c1d0e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2"

echo "All environment variables added!"