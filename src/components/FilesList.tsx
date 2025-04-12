'use client';

import { 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Paper,
  Typography,
  Stack,
  Chip
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useUppy } from "@/contexts/UppyContext";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'default';
    case 'processing': return 'warning';
    case 'completed': return 'success';
    case 'error': return 'error';
    default: return 'default';
  }
};

export default function FilesList() {
  const { files, removeFile, processFile } = useUppy();

  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Uploaded Files ({files.length})
      </Typography>
      <List>
        {files.map((file) => (
          <ListItem
            key={file.id}
            secondaryAction={
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip 
                  label={file.status}
                  color={getStatusColor(file.status)}
                  size="small"
                />
                <IconButton 
                  edge="end" 
                  onClick={() => processFile(file.id)}
                  color="primary"
                  disabled={file.status === 'processing' || file.status === 'completed'}
                >
                  <PlayArrowIcon />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === 'processing'}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText 
              primary={file.name}
              secondary={
                <>
                  Size: {(file.size / 1024).toFixed(2)} KB | 
                  Type: {file.type} | 
                  Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}