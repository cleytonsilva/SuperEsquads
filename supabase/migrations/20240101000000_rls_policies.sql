-- Implementa políticas de segurança para todas as tabelas

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários podem ler apenas seu próprio perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política UPDATE: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política INSERT: Usuários podem criar seu próprio perfil durante o registro
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- COURSES TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários autenticados podem ler cursos publicados
CREATE POLICY "courses_select_published" ON courses
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    status = 'published'
  );

-- Política SELECT: Admins podem ler todos os cursos
CREATE POLICY "courses_select_admin" ON courses
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política INSERT: Apenas admins podem criar cursos
CREATE POLICY "courses_insert_admin" ON courses
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política UPDATE: Apenas admins podem atualizar cursos
CREATE POLICY "courses_update_admin" ON courses
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- MODULES TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários autenticados podem ler módulos de cursos publicados
CREATE POLICY "modules_select_published_courses" ON modules
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = modules.course_id 
      AND courses.status = 'published'
    )
  );

-- Política SELECT: Admins podem ler todos os módulos
CREATE POLICY "modules_select_admin" ON modules
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política INSERT: Apenas admins podem criar módulos
CREATE POLICY "modules_insert_admin" ON modules
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política UPDATE: Apenas admins podem atualizar módulos
CREATE POLICY "modules_update_admin" ON modules
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- LESSONS TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários autenticados podem ler lições de cursos publicados
CREATE POLICY "lessons_select_published_courses" ON lessons
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM modules 
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id 
      AND courses.status = 'published'
    )
  );

-- Política SELECT: Admins podem ler todas as lições
CREATE POLICY "lessons_select_admin" ON lessons
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política INSERT: Apenas admins podem criar lições
CREATE POLICY "lessons_insert_admin" ON lessons
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política UPDATE: Apenas admins podem atualizar lições
CREATE POLICY "lessons_update_admin" ON lessons
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- ENROLLMENTS TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários podem ver apenas suas próprias matrículas
CREATE POLICY "enrollments_select_own" ON enrollments
  FOR SELECT
  USING (auth.uid() = student_id);

-- Política SELECT: Admins podem ver todas as matrículas
CREATE POLICY "enrollments_select_admin" ON enrollments
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política INSERT: Usuários podem se matricular (apenas em cursos publicados)
CREATE POLICY "enrollments_insert_own" ON enrollments
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_id 
      AND courses.status = 'published'
    )
  );

-- Política UPDATE: Usuários podem atualizar apenas suas próprias matrículas
CREATE POLICY "enrollments_update_own" ON enrollments
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Política UPDATE: Admins podem atualizar qualquer matrícula
CREATE POLICY "enrollments_update_admin" ON enrollments
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- PROGRESS TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela progress
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários podem ver apenas seu próprio progresso
CREATE POLICY "progress_select_own" ON progress
  FOR SELECT
  USING (auth.uid() = student_id);

-- Política SELECT: Admins podem ver todo o progresso
CREATE POLICY "progress_select_admin" ON progress
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política INSERT: Usuários podem criar seu próprio progresso
CREATE POLICY "progress_insert_own" ON progress
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE enrollments.student_id = auth.uid() 
      AND enrollments.course_id = progress.course_id
    )
  );

-- Política UPDATE: Usuários podem atualizar apenas seu próprio progresso
CREATE POLICY "progress_update_own" ON progress
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- =====================================================
-- CERTIFICATES TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários podem ver apenas seus próprios certificados
CREATE POLICY "certificates_select_own" ON certificates
  FOR SELECT
  USING (auth.uid() = student_id);

-- Política SELECT: Admins podem ver todos os certificados
CREATE POLICY "certificates_select_admin" ON certificates
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política INSERT: Sistema pode criar certificados (via Edge Functions)
CREATE POLICY "certificates_insert_system" ON certificates
  FOR INSERT
  WITH CHECK (
    -- Permite inserção via service role (Edge Functions)
    auth.role() = 'service_role' OR
    -- Ou se o usuário é admin
    (
      auth.role() = 'authenticated' AND 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    )
  );

-- =====================================================
-- QUIZ_QUESTIONS TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela quiz_questions
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários autenticados podem ler questões de cursos publicados
CREATE POLICY "quiz_questions_select_published" ON quiz_questions
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM modules 
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = quiz_questions.module_id 
      AND courses.status = 'published'
    )
  );

-- Política SELECT: Admins podem ler todas as questões
CREATE POLICY "quiz_questions_select_admin" ON quiz_questions
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política INSERT: Apenas admins podem criar questões
CREATE POLICY "quiz_questions_insert_admin" ON quiz_questions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- QUIZ_OPTIONS TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela quiz_options
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuários autenticados podem ler opções de questões de cursos publicados
CREATE POLICY "quiz_options_select_published" ON quiz_options
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM quiz_questions 
      JOIN modules ON modules.id = quiz_questions.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE quiz_questions.id = quiz_options.question_id 
      AND courses.status = 'published'
    )
  );

-- Política SELECT: Admins podem ler todas as opções
CREATE POLICY "quiz_options_select_admin" ON quiz_options
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política INSERT: Apenas admins podem criar opções
CREATE POLICY "quiz_options_insert_admin" ON quiz_options
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- QUIZ_ATTEMPTS TABLE POLICIES
-- =====================================================

-- Habilita RLS na tabela quiz_attempts (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quiz_attempts') THEN
    ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
    
    -- Política SELECT: Usuários podem ver apenas suas próprias tentativas
    CREATE POLICY "quiz_attempts_select_own" ON quiz_attempts
      FOR SELECT
      USING (auth.uid() = student_id);
    
    -- Política INSERT: Usuários podem criar suas próprias tentativas
    CREATE POLICY "quiz_attempts_insert_own" ON quiz_attempts
      FOR INSERT
      WITH CHECK (auth.uid() = student_id);
    
    -- Política UPDATE: Usuários podem atualizar suas próprias tentativas
    CREATE POLICY "quiz_attempts_update_own" ON quiz_attempts
      FOR UPDATE
      USING (auth.uid() = student_id)
      WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

-- =====================================================
-- FUNÇÕES AUXILIARES PARA SEGURANÇA
-- =====================================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_id 
    AND profiles.role = 'admin'
  );
$$;

-- Função para verificar se usuário está matriculado em um curso
CREATE OR REPLACE FUNCTION is_enrolled(course_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = $1 
    AND enrollments.student_id = user_id
    AND enrollments.status = 'active'
  );
$$;

-- Função para verificar se curso está publicado
CREATE OR REPLACE FUNCTION is_course_published(course_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_id 
    AND courses.status = 'published'
  );
$$;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para otimizar consultas de RLS
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_student_course ON progress(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY "profiles_select_own" ON profiles IS 
'Permite que usuários leiam apenas seu próprio perfil';

COMMENT ON POLICY "courses_select_published" ON courses IS 
'Permite que usuários autenticados leiam apenas cursos publicados';

COMMENT ON POLICY "enrollments_select_own" ON enrollments IS 
'Permite que usuários vejam apenas suas próprias matrículas';

COMMENT ON POLICY "progress_select_own" ON progress IS 
'Permite que usuários vejam apenas seu próprio progresso';

COMMENT ON POLICY "certificates_select_own" ON certificates IS 
'Permite que usuários vejam apenas seus próprios certificados';

COMMENT ON FUNCTION is_admin(UUID) IS 
'Função auxiliar para verificar se um usuário tem privilégios de administrador';

COMMENT ON FUNCTION is_enrolled(UUID, UUID) IS 
'Função auxiliar para verificar se um usuário está matriculado em um curso específico';

COMMENT ON FUNCTION is_course_published(UUID) IS 
'Função auxiliar para verificar se um curso está publicado e disponível';