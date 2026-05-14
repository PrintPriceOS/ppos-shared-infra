# PrintPrice OS Preflight Engine Base Layer
# Provides persistent industrial PDF extraction tools to guarantee accurate forensic diagnostics.
FROM node:20-slim

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Task 2: Permanent installation of industrial extraction and diagnostic tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    mupdf-tools \
    ghostscript \
    qpdf \
    libimage-exiftool-perl \
    which \
    file \
    && rm -rf /var/lib/apt/lists/*

# Task 3: Build-time verification to guarantee final image compatibility
RUN which pdfinfo && \
    which pdfimages && \
    which mutool && \
    which qpdf && \
    which file && \
    gs --version

# Set consistent working directory
WORKDIR /app
