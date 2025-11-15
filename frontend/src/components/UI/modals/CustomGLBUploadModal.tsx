import { useState, useRef } from 'react';
import {
  Modal,
  Typography,
  Button,
  Box,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import { Delete, CloudUpload } from '@mui/icons-material';
import { StyledModal } from '../../../styles/Modal.styles';
import { useMutation, useQuery } from '@apollo/client';
import UPLOAD_CUSTOM_GLB_MUTATION from '../../../graphql/glb/uploadCustomGLB';
import MY_CUSTOM_GLBS_QUERY from '../../../graphql/glb/myCustomGLBs';
import DELETE_CUSTOM_GLB_MUTATION from '../../../graphql/glb/deleteCustomGLB';

interface CustomGLBUploadModalProps {
  open: boolean;
  onClose: () => void;
}

const CustomGLBUploadModal: React.FC<CustomGLBUploadModalProps> = ({
  open,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { data: glbsData, refetch: refetchGLBs } = useQuery(MY_CUSTOM_GLBS_QUERY, {
    skip: !open,
  });

  const [uploadGLB, { loading: uploadLoading }] = useMutation(
    UPLOAD_CUSTOM_GLB_MUTATION,
    {
      onCompleted: () => {
        setSelectedFile(null);
        setUploadProgress(0);
        setError(null);
        refetchGLBs();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: (err) => {
        setError(err.message || 'Failed to upload GLB file');
        setUploadProgress(0);
      },
    }
  );

  const [deleteGLB] = useMutation(DELETE_CUSTOM_GLB_MUTATION, {
    onCompleted: () => {
      refetchGLBs();
    },
    onError: (err) => {
      setError(err.message || 'Failed to delete GLB file');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.glb')) {
      setError('Please select a .glb file');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be under 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setError(null);
    setUploadProgress(0);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };

      reader.onload = async () => {
        const base64Data = reader.result as string;
        // Remove data:application/octet-stream;base64, prefix
        const base64Content = base64Data.split(',')[1];

        await uploadGLB({
          variables: {
            input: {
              filename: selectedFile.name,
              fileData: base64Content,
            },
          },
        });
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploadProgress(0);
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file');
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this GLB file?')) {
      await deleteGLB({
        variables: { id },
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const myGLBs = glbsData?.myCustomGLBs || [];
  const glbCount = myGLBs.length;
  const glbLimit = 10;

  return (
    <Modal open={open} onClose={onClose}>
      <StyledModal sx={{ maxWidth: '700px' }}>
        <Typography variant="h5" component="h2">
          Custom GLB Upload
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Upload Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Upload New Model
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload custom 3D models in GLB format. Max 5MB per file, up to {glbLimit}{' '}
              files total.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="glb-file-input"
              />
              <label htmlFor="glb-file-input" style={{ flexGrow: 1 }}>
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<CloudUpload />}
                  disabled={glbCount >= glbLimit}
                >
                  {selectedFile ? selectedFile.name : 'Choose GLB File'}
                </Button>
              </label>

              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || uploadLoading || glbCount >= glbLimit}
              >
                Upload
              </Button>
            </Box>

            {selectedFile && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Size: {formatFileSize(selectedFile.size)}
              </Typography>
            )}

            {uploadLoading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" sx={{ mt: 0.5 }}>
                  Uploading... {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 1 }}>
              <Chip
                label={`${glbCount} / ${glbLimit} files used`}
                size="small"
                color={glbCount >= glbLimit ? 'error' : 'default'}
              />
            </Box>
          </Box>

          {/* My GLBs List */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              My Custom Models ({glbCount})
            </Typography>

            {myGLBs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No custom models uploaded yet.
              </Typography>
            ) : (
              <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {myGLBs.map((glb: {
                  id: string;
                  originalFilename: string;
                  fileSize: number;
                  createdAt: string;
                }) => (
                  <ListItem
                    key={glb.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(glb.id)}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={glb.originalFilename}
                      secondary={`${formatFileSize(glb.fileSize)} • Uploaded ${new Date(
                        glb.createdAt
                      ).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Button variant="outlined" fullWidth onClick={onClose}>
            Close
          </Button>
        </Box>
      </StyledModal>
    </Modal>
  );
};

export default CustomGLBUploadModal;
