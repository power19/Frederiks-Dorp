/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "nodemailer"],
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
