export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
}

/**
 * Helper to parse google API errors, translating quota errors elegantly.
 */
function parseDriveError(errText: string, defaultMsg: string, status: number): Error {
  try {
    const parsed = JSON.parse(errText);
    const apiError = parsed.error;
    if (apiError) {
      const message = apiError.message || '';
      const isQuota = apiError.errors?.some((e: any) => e.reason === 'storageQuotaExceeded') || 
                      message.toLowerCase().includes('quota') || 
                      message.toLowerCase().includes('storage') ||
                      status === 403;
      
      if (isQuota) {
        const err: any = new Error(
          'Ruang penyimpanan (quota) Google Drive Anda penuh atau melebihi batas. ' +
          'Silakan hapus beberapa berkas di Google Drive/Gmail Anda atau kosongkan tong sampah Drive Anda, lalu coba lagi.'
        );
        err.status = status;
        err.reason = 'storageQuotaExceeded';
        return err;
      }
      
      const err: any = new Error(apiError.message || defaultMsg);
      err.status = status;
      err.reason = apiError.errors?.[0]?.reason || '';
      return err;
    }
  } catch (e) {
    // Fallback if parsing fails
  }

  const err: any = new Error(defaultMsg);
  err.status = status;
  return err;
}

/**
 * Searches Google Drive for a file with a specific name.
 * Returns the file ID if found, other null.
 */
export async function searchBackupFile(accessToken: string, filename: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${filename}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name, mimeType)`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to search Drive file:', errText);
    throw parseDriveError(errText, 'Gagal mencari file cadangan di Google Drive.', response.status);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Downloads the content of a file from Google Drive.
 */
export async function downloadBackupFile(accessToken: string, fileId: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to download Drive file:', errText);
    throw parseDriveError(errText, 'Gagal mengunduh file cadangan dari Google Drive.', response.status);
  }

  return await response.text();
}

/**
 * Uploads a file (create or update) to Google Drive.
 */
export async function uploadBackupFile(accessToken: string, filename: string, content: string): Promise<string> {
  // 1. Search if file already exists
  const existingFileId = await searchBackupFile(accessToken, filename);

  if (existingFileId) {
    // File exists, let's update it using PATCH media upload
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
    const response = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: content,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to update Drive file content:', errText);
      throw parseDriveError(errText, 'Gagal memperbarui file cadangan di Google Drive.', response.status);
    }
    
    return existingFileId;
  } else {
    // File doesn't exist, let's create metadata first
    const createMetaUrl = 'https://www.googleapis.com/drive/v3/files';
    const metaResponse = await fetch(createMetaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: filename,
        mimeType: 'application/json',
      }),
    });

    if (!metaResponse.ok) {
      const errText = await metaResponse.text();
      console.error('Failed to create Drive file metadata:', errText);
      throw parseDriveError(errText, 'Gagal membuat metadata file di Google Drive.', metaResponse.status);
    }

    const fileMeta = await metaResponse.json();
    const newFileId = fileMeta.id;

    // Now, upload content utilizing the generated fileId
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: content,
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      console.error('Failed to upload Drive file content:', errText);
      throw parseDriveError(errText, 'Gagal mengunggah konten file ke Google Drive.', uploadResponse.status);
    }

    return newFileId;
  }
}

/**
 * Lists all JSON files from Google Drive (e.g. for restore options).
 */
export async function listBackupFiles(accessToken: string): Promise<GoogleDriveFile[]> {
  const query = encodeURIComponent("mimeType = 'application/json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc,name&fields=files(id, name, mimeType, createdTime, modifiedTime)`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to list Drive files:', errText);
    throw parseDriveError(errText, 'Gagal mengambil daftar file cadangan di Google Drive.', response.status);
  }

  const data = await response.json();
  return data.files || [];
}
