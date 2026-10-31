-- Phase 2 RLS preparation script.
-- DO NOT RUN without review/approval.
--
-- IMPORTANT:
-- Project Brain AI Phase 2 uses custom JWT authentication validated by FastAPI.
-- The backend connects to PostgreSQL with its own database credentials and performs
-- application-level ownership checks. Supabase RLS auth.uid() recognizes Supabase Auth
-- JWTs, not this application's custom JWTs.
--
-- These policies are therefore a defense-in-depth layer for any future direct
-- Supabase client access. If direct Supabase client access is introduced, align the
-- client authentication strategy with these policies or replace them with a strategy
-- compatible with the application's JWT claims.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users may read and update their own profile row.
CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users
    FOR UPDATE USING (auth.uid() = id);

-- Projects are owned by their user.
CREATE POLICY projects_owner_all ON projects
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Child resources are accessible only through an owned project.
CREATE POLICY repositories_project_owner ON repositories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = repositories.project_id
              AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = repositories.project_id
              AND p.user_id = auth.uid()
        )
    );

CREATE POLICY documents_project_owner ON documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = documents.project_id
              AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = documents.project_id
              AND p.user_id = auth.uid()
        )
    );

CREATE POLICY chunks_project_owner ON chunks
    FOR ALL USING (
        project_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = chunks.project_id
              AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = chunks.project_id
              AND p.user_id = auth.uid()
        )
    );

CREATE POLICY graph_nodes_project_owner ON graph_nodes
    FOR ALL USING (
        project_id IS NULL
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = graph_nodes.project_id
              AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IS NULL
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = graph_nodes.project_id
              AND p.user_id = auth.uid()
        )
    );

CREATE POLICY graph_edges_project_owner ON graph_edges
    FOR ALL USING (
        project_id IS NULL
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = graph_edges.project_id
              AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IS NULL
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = graph_edges.project_id
              AND p.user_id = auth.uid()
        )
    );

CREATE POLICY conversations_project_owner ON conversations
    FOR ALL USING (
        project_id IS NULL
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = conversations.project_id
              AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IS NULL
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = conversations.project_id
              AND p.user_id = auth.uid()
        )
    );

CREATE POLICY messages_conversation_owner ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            JOIN projects p ON p.id = c.project_id
            WHERE c.id = messages.conversation_id
              AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            JOIN projects p ON p.id = c.project_id
            WHERE c.id = messages.conversation_id
              AND p.user_id = auth.uid()
        )
    );