import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Basis-Service: stellt den Supabase-Client bereit.
 * Alle anderen Services injizieren diesen Service statt den Client direkt anzulegen.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** Der einzige Supabase-Client der gesamten App */
  readonly client: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);
}
