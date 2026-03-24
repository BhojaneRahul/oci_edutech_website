/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.ociedutech.com"
      },
      {
        protocol: "https",
        hostname: "www.ociedutech.com"
      },
      {
        protocol: "https",
        hostname: "ociedutech.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000"
      }
    ]
  }
};

module.exports = nextConfig;
