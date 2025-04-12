import * as React from "react";
import Link from "next/link";

import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";

export default function MarketingPage() {
  return (
    <>
      <CssBaseline enableColorScheme />
      <Box>
        <Container
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: { xs: 14, sm: 20 },
            pb: { xs: 8, sm: 12 },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              fontSize: "clamp(3rem, 10vw, 3.5rem)",
              color: "primary.main",
            }}
          >
            Desafio Técnico Backend NodeJS
          </Typography>
          <Box sx={{
            mt: 3,
          }}>
            <Button
              color="primary"
              variant="contained"
              fullWidth
              component={Link}
              href="/auth/signin"
            >
              Entrar
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
}
