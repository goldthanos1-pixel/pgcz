-- Function to atomically increment points and log transaction
CREATE OR REPLACE FUNCTION increment_points(
    target_user_id UUID,
    amount INT,
    txn_type TEXT,
    txn_description TEXT DEFAULT ''
) RETURNS VOID AS $$
BEGIN
    -- Update user's points
    UPDATE users
    SET points = points + amount
    WHERE id = target_user_id;

    -- Insert transaction log
    INSERT INTO point_transactions (user_id, amount, type, description)
    VALUES (target_user_id, amount, txn_type, txn_description);
END;
$$ LANGUAGE plpgsql VOLATILE;
