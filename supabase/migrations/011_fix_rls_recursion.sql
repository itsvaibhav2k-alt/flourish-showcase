-- Fix infinite recursion in organization_members RLS policy
-- The previous policy queried organization_members within itself, causing recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS organization_members_select_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_insert_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_delete_policy ON organization_members;

-- Create fixed SELECT policy - users can see their own memberships
CREATE POLICY organization_members_select_policy ON organization_members
    FOR SELECT
    USING (user_id = auth.uid());

-- Create fixed INSERT policy - only admins can add members (check via function)
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY organization_members_insert_policy ON organization_members
    FOR INSERT
    WITH CHECK (is_org_admin(organization_id));

-- Create fixed DELETE policy - only admins can remove members
CREATE POLICY organization_members_delete_policy ON organization_members
    FOR DELETE
    USING (is_org_admin(organization_id));

-- Also fix organizations SELECT policy to avoid recursion
DROP POLICY IF EXISTS organizations_select_policy ON organizations;

-- Users can see organizations they're members of (using SECURITY DEFINER function)
CREATE OR REPLACE FUNCTION user_organization_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY organizations_select_policy ON organizations
    FOR SELECT
    USING (id IN (SELECT user_organization_ids()));

-- Fix organizations UPDATE policy similarly
DROP POLICY IF EXISTS organizations_update_policy ON organizations;

CREATE POLICY organizations_update_policy ON organizations
    FOR UPDATE
    USING (is_org_admin(id));
