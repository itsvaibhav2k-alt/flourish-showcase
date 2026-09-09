-- Migration 047: Atomic Shift Signup
-- Race-condition-free shift signup with capacity checking

-- First, add 'waitlisted' status to shift_signups
ALTER TABLE shift_signups DROP CONSTRAINT IF EXISTS shift_signups_status_check;
ALTER TABLE shift_signups ADD CONSTRAINT shift_signups_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'waitlisted'));

-- Add updated_at to shifts if not exists
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Atomic shift signup to prevent race conditions on capacity
CREATE OR REPLACE FUNCTION atomic_shift_signup(
  p_shift_id UUID,
  p_contact_id UUID,
  p_org_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_shift RECORD;
  v_current_signups INTEGER;
  v_signup_id UUID;
BEGIN
  -- Lock the shift row to prevent concurrent modifications
  SELECT * INTO v_shift FROM shifts
  WHERE id = p_shift_id AND organization_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shift not found');
  END IF;

  -- Check if contact already signed up
  IF EXISTS (SELECT 1 FROM shift_signups WHERE shift_id = p_shift_id AND contact_id = p_contact_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already signed up for this shift');
  END IF;

  -- Count current confirmed signups
  SELECT COUNT(*) INTO v_current_signups
  FROM shift_signups
  WHERE shift_id = p_shift_id AND status = 'confirmed';

  -- Check capacity
  IF v_shift.capacity IS NOT NULL AND v_current_signups >= v_shift.capacity THEN
    -- Add to waitlist instead
    INSERT INTO shift_signups (shift_id, contact_id, status)
    VALUES (p_shift_id, p_contact_id, 'waitlisted')
    RETURNING id INTO v_signup_id;

    RETURN jsonb_build_object('success', true, 'status', 'waitlisted', 'signup_id', v_signup_id);
  END IF;

  -- Insert confirmed signup
  INSERT INTO shift_signups (shift_id, contact_id, status)
  VALUES (p_shift_id, p_contact_id, 'confirmed')
  RETURNING id INTO v_signup_id;

  -- Update shift status if now full
  IF v_shift.capacity IS NOT NULL AND v_current_signups + 1 >= v_shift.capacity THEN
    UPDATE shifts SET status = 'full', updated_at = NOW() WHERE id = p_shift_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'status', 'confirmed', 'signup_id', v_signup_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
