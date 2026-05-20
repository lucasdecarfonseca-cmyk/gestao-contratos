import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://dguazdtkirafnvzrzxxh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndWF6ZHRraXJhZm52enJ6eHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDE0NDMsImV4cCI6MjA5NDg3NzQ0M30.hZychRDm_GhHtcNvBKx0wB6sMPIeJ6Hwm8Z9QZK_XkA'
)
