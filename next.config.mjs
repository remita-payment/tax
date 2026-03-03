const nextConfig = {
  reactCompiler: true,

  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: '2mb',
  //   },
  // },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/djr7uqara/**',
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;