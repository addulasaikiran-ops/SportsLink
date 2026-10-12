/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/landing/index.html' }],
    };
  },
};

module.exports = nextConfig;
