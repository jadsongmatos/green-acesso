import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import { UppyProvider } from "@/contexts/UppyContext";

import Uppy from "@/components/Uppy";
import FilesList from "@/components/FilesList";

export default function HomePage() {
  return (
    <UppyProvider>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
        <Typography variant="h4" gutterBottom>
          File Upload Dashboard
        </Typography>
        <Uppy />
        <FilesList />
      </Box>
    </UppyProvider>
  );
}