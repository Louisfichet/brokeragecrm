/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Empêcher webpack de bundler pdfkit et ses dépendances
      config.externals = config.externals || [];
      config.externals.push("pdfkit");
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
