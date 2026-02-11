// Google Drive Backup Service
import { Capacitor } from '@capacitor/core';

const BACKUP_FOLDER_NAME = 'CredPOS_Backups';
const BACKUP_FILE_NAME = 'credpos_backup.json';

// Get access token from Firebase Auth
const getAccessToken = async (): Promise<string | null> => {
    try {
        // For Capacitor, we need to get the access token from Firebase
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const result = await FirebaseAuthentication.getIdToken();
        return result.token;
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
};

// Get or create CredPOS backup folder
const getOrCreateBackupFolder = async (accessToken: string): Promise<string | null> => {
    try {
        // Search for existing folder
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const searchData = await searchResponse.json();

        if (searchData.files && searchData.files.length > 0) {
            return searchData.files[0].id;
        }

        // Create new folder
        const createResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: BACKUP_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder',
                }),
            }
        );

        const createData = await createResponse.json();
        return createData.id;
    } catch (error) {
        console.error('Error getting/creating folder:', error);
        return null;
    }
};

// Check if backup file exists
const getBackupFileId = async (accessToken: string, folderId: string): Promise<string | null> => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }

        return null;
    } catch (error) {
        console.error('Error checking backup file:', error);
        return null;
    }
};

export interface BackupData {
    version: string;
    timestamp: number;
    user: object | null;
    products: unknown[];
    transactions: unknown[];
}

export const backupService = {
    // Create backup data from localStorage
    createBackupData: (): BackupData => {
        return {
            version: '1.0',
            timestamp: Date.now(),
            user: JSON.parse(localStorage.getItem('credpos_user') || 'null'),
            products: JSON.parse(localStorage.getItem('credpos_products') || '[]'),
            transactions: JSON.parse(localStorage.getItem('credpos_transactions') || '[]'),
        };
    },

    // Backup to Google Drive
    backupToGoogleDrive: async (): Promise<{ success: boolean; message: string }> => {
        try {
            if (!Capacitor.isNativePlatform()) {
                return { success: false, message: 'Backup only available on mobile devices' };
            }

            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

            // Get current user
            const user = await FirebaseAuthentication.getCurrentUser();
            if (!user.user) {
                return { success: false, message: 'Please sign in with Google first' };
            }

            // Get fresh access token
            const credential = await FirebaseAuthentication.signInWithGoogle();
            const accessToken = credential.credential?.accessToken;

            if (!accessToken) {
                return { success: false, message: 'Failed to get access token' };
            }

            // Get or create backup folder
            const folderId = await getOrCreateBackupFolder(accessToken);
            if (!folderId) {
                return { success: false, message: 'Failed to create backup folder' };
            }

            // Create backup data
            const backupData = backupService.createBackupData();
            const backupContent = JSON.stringify(backupData, null, 2);

            // Check if backup file exists
            const existingFileId = await getBackupFileId(accessToken, folderId);

            if (existingFileId) {
                // Update existing file
                const response = await fetch(
                    `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: backupContent,
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to update backup file');
                }
            } else {
                // Create new file with multipart upload
                const metadata = {
                    name: BACKUP_FILE_NAME,
                    parents: [folderId],
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', new Blob([backupContent], { type: 'application/json' }));

                const response = await fetch(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        body: form,
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to create backup file');
                }
            }

            return {
                success: true,
                message: `Backup successful! ${backupData.products.length} products, ${backupData.transactions.length} transactions saved.`
            };
        } catch (error) {
            console.error('Backup error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Backup failed'
            };
        }
    },

    // Restore from Google Drive
    restoreFromGoogleDrive: async (): Promise<{ success: boolean; message: string }> => {
        try {
            if (!Capacitor.isNativePlatform()) {
                return { success: false, message: 'Restore only available on mobile devices' };
            }

            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

            // Get current user
            const user = await FirebaseAuthentication.getCurrentUser();
            if (!user.user) {
                return { success: false, message: 'Please sign in with Google first' };
            }

            // Get fresh access token
            const credential = await FirebaseAuthentication.signInWithGoogle();
            const accessToken = credential.credential?.accessToken;

            if (!accessToken) {
                return { success: false, message: 'Failed to get access token' };
            }

            // Get backup folder
            const folderId = await getOrCreateBackupFolder(accessToken);
            if (!folderId) {
                return { success: false, message: 'No backup folder found' };
            }

            // Get backup file
            const fileId = await getBackupFileId(accessToken, folderId);
            if (!fileId) {
                return { success: false, message: 'No backup found. Please create a backup first.' };
            }

            // Download backup file
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to download backup');
            }

            const backupData: BackupData = await response.json();

            // Validate backup data
            if (!backupData.version || !backupData.timestamp) {
                return { success: false, message: 'Invalid backup file' };
            }

            // Restore data to localStorage
            if (backupData.products) {
                localStorage.setItem('credpos_products', JSON.stringify(backupData.products));
            }
            if (backupData.transactions) {
                localStorage.setItem('credpos_transactions', JSON.stringify(backupData.transactions));
            }

            const backupDate = new Date(backupData.timestamp).toLocaleString();

            return {
                success: true,
                message: `Restore successful! Data from ${backupDate} restored. ${backupData.products?.length || 0} products, ${backupData.transactions?.length || 0} transactions.`
            };
        } catch (error) {
            console.error('Restore error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Restore failed'
            };
        }
    },

    // Get last backup info
    getBackupInfo: async (): Promise<{ hasBackup: boolean; lastBackup?: string }> => {
        try {
            if (!Capacitor.isNativePlatform()) {
                return { hasBackup: false };
            }

            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

            const user = await FirebaseAuthentication.getCurrentUser();
            if (!user.user) {
                return { hasBackup: false };
            }

            const credential = await FirebaseAuthentication.signInWithGoogle();
            const accessToken = credential.credential?.accessToken;

            if (!accessToken) {
                return { hasBackup: false };
            }

            const folderId = await getOrCreateBackupFolder(accessToken);
            if (!folderId) {
                return { hasBackup: false };
            }

            const fileId = await getBackupFileId(accessToken, folderId);
            if (!fileId) {
                return { hasBackup: false };
            }

            // Get file metadata
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const data = await response.json();

            return {
                hasBackup: true,
                lastBackup: new Date(data.modifiedTime).toLocaleString()
            };
        } catch (error) {
            return { hasBackup: false };
        }
    },
};
