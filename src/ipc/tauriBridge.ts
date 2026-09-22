import { BuilderPersistedState } from '../types/builder';

export interface SaveJavaFileRequest {
  suggestedFileName: string;
  content: string;
}

export interface SaveJavaFileResponse {
  success: boolean;
  filePath: string | null;
  error: string | null;
}

export interface SaveProjectStateRequest {
  suggestedFileName: string;
  projectState: BuilderPersistedState;
}

export interface SaveProjectStateResponse {
  success: boolean;
  filePath: string | null;
  error: string | null;
}

export interface LoadProjectStateResponse {
  success: boolean;
  projectState: BuilderPersistedState | null;
  error: string | null;
}

export interface AppConfig {
  splitPaneRatio: number;
  windowWidth: number;
  windowHeight: number;
}

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// IPC-1: save_java_file
export async function saveJavaFile(request: SaveJavaFileRequest): Promise<SaveJavaFileResponse> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<SaveJavaFileResponse>('save_java_file', { request });
    } catch (err: any) {
      return { success: false, filePath: null, error: err?.message || String(err) };
    }
  }

  // Browser Fallback: Native HTML5 Download
  try {
    const blob = new Blob([request.content], { type: 'text/x-java-source;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = request.suggestedFileName || 'GeneratedForm.java';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true, filePath: request.suggestedFileName, error: null };
  } catch (err: any) {
    return { success: false, filePath: null, error: err?.message || 'Download failed' };
  }
}

// IPC-2: save_project_state
export async function saveProjectState(
  request: SaveProjectStateRequest
): Promise<SaveProjectStateResponse> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<SaveProjectStateResponse>('save_project_state', { request });
    } catch (err: any) {
      return { success: false, filePath: null, error: err?.message || String(err) };
    }
  }

  // Browser Fallback: JSON File Download
  try {
    const jsonStr = JSON.stringify(request.projectState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = request.suggestedFileName || 'MyForm.jforge.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true, filePath: request.suggestedFileName, error: null };
  } catch (err: any) {
    return { success: false, filePath: null, error: err?.message || 'Save failed' };
  }
}

// IPC-3: load_project_state
export async function loadProjectState(): Promise<LoadProjectStateResponse> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<LoadProjectStateResponse>('load_project_state');
    } catch (err: any) {
      return { success: false, projectState: null, error: err?.message || String(err) };
    }
  }

  // Browser Fallback: Hidden file picker
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.jforge.json';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        resolve({ success: false, projectState: null, error: null }); // Cancelled
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const raw = JSON.parse(event.target?.result as string);
          // Frontend Schema Validation (FR-1.4.1)
          if (raw.schemaVersion !== 1) {
            resolve({
              success: false,
              projectState: null,
              error: `Unsupported schemaVersion: ${raw.schemaVersion}. Expected schemaVersion: 1.`,
            });
            return;
          }
          if (!raw.rootId || !raw.tree) {
            resolve({
              success: false,
              projectState: null,
              error: 'Invalid project structure. Missing rootId or tree.',
            });
            return;
          }
          resolve({ success: true, projectState: raw as BuilderPersistedState, error: null });
        } catch (err: any) {
          resolve({ success: false, projectState: null, error: 'Malformed JSON file.' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, projectState: null, error: 'Failed to read file.' });
      };
      reader.readAsText(file);
    };

    // User cancelled file picker
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!input.files?.length) {
            resolve({ success: false, projectState: null, error: null });
          }
        }, 500);
      },
      { once: true }
    );

    input.click();
  });
}

// IPC-4: get_app_config / set_app_config
export async function getAppConfig(): Promise<AppConfig> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<AppConfig>('get_app_config');
    } catch {
      // fallback to defaults
    }
  }

  try {
    const saved = localStorage.getItem('jforge_app_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }

  return {
    splitPaneRatio: 0.58,
    windowWidth: 1400,
    windowHeight: 900,
  };
}

export async function setAppConfig(config: AppConfig): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_app_config', { config });
      return;
    } catch {
      // ignore
    }
  }

  try {
    localStorage.setItem('jforge_app_config', JSON.stringify(config));
  } catch {
    // ignore
  }
}
