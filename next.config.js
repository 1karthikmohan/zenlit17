/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'i.pravatar.cc',
      'picsum.photos',
      'randomuser.me',
      'media.istockphoto.com'
    ],
  },
}

export default nextConfig