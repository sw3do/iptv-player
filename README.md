# 📺 IPTV Player

A modern, responsive IPTV streaming application built with Next.js 14, TypeScript, and Tailwind CSS. Stream live TV channels with advanced features like search, filtering, favorites, and robust video playback.

![IPTV Player](https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🎬 Video Streaming
- **HLS Support**: Native HLS streaming with automatic quality adjustment
- **Multiple Format Support**: MP4, M3U8, and other common video formats
- **Retry Mechanism**: Automatic retry on stream failures with fallback options
- **Smart Stream Selection**: Automatically selects the best quality stream available
- **Buffer Management**: Optimized buffering for smooth playback

### 🔍 Content Discovery
- **Real-time Search**: Search channels by name or keywords
- **Category Filtering**: Filter channels by categories (News, Sports, Entertainment, etc.)
- **Country Filtering**: Browse channels by country
- **Advanced Filters**: Combined filtering options for precise results

### 🎨 User Experience
- **Modern UI**: Clean, glassmorphism design with smooth animations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Theme**: Eye-friendly dark theme with gradient backgrounds
- **Loading States**: Visual feedback during content loading
- **Error Handling**: Graceful error handling with user-friendly messages

### 💾 User Preferences
- **Favorites**: Save favorite channels for quick access
- **Volume Control**: Persistent volume settings
- **Playback Controls**: Play, pause, mute, and fullscreen controls
- **Channel History**: Remember last watched channel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- npm, yarn, or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sw3do/iptv-player.git
   cd iptv-player
   ```

2. **Install dependencies**
   ```bash
   # Using bun (recommended)
   bun install
   
   # Or using npm
   npm install
   
   # Or using yarn
   yarn install
   ```

3. **Start the development server**
   ```bash
   # Using bun
   bun dev
   
   # Or using npm
   npm run dev
   
   # Or using yarn
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with hooks and context
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### Video & Animation
- **HLS.js** - JavaScript HLS client
- **Framer Motion** - Animation library
- **Heroicons** - Beautiful SVG icons

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Bun** - Fast JavaScript runtime and package manager

## 📁 Project Structure

```
iptv-player/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page component
│   ├── lib/
│   │   └── api.ts          # API functions
│   └── types/
│       └── iptv.ts         # TypeScript interfaces
├── public/                 # Static assets
├── tailwind.config.js     # Tailwind configuration
├── next.config.ts         # Next.js configuration
└── package.json          # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration (if using external APIs)
NEXT_PUBLIC_API_URL=your_api_url_here

# Optional: Analytics or monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Custom Styling

The app uses Tailwind CSS with custom glass morphism effects. You can customize the theme in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      // Add your custom colors, fonts, etc.
    }
  }
}
```

## 🎯 Usage

### Adding Channels
1. Channels are loaded from the API defined in `src/lib/api.ts`
2. Modify the API functions to connect to your IPTV source
3. Ensure your streams are in supported formats (HLS, MP4)

### Customizing UI
- Edit `src/app/globals.css` for global styles
- Modify `src/app/page.tsx` for layout changes
- Update color schemes in Tailwind config

## 🔄 API Integration

The app expects the following data structure:

```typescript
interface ChannelWithStream {
  id: string
  name: string
  logo?: string
  country: string
  categories: string[]
  streams: Stream[]
}

interface Stream {
  url: string
  quality: string
  type: 'hls' | 'mp4' | 'other'
}
```

Implement your data source in `src/lib/api.ts`.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy with one click

### Docker
```bash
# Build the image
docker build -t iptv-player .

# Run the container
docker run -p 3000:3000 iptv-player
```

### Static Export
```bash
# Build for static hosting
npm run build
npm run export
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [HLS.js](https://github.com/video-dev/hls.js/) for video streaming
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Heroicons](https://heroicons.com/) for icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/sw3do/iptv-player/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

<div align="center">
  <strong>⭐ If you like this project, please give it a star! ⭐</strong>
</div>
