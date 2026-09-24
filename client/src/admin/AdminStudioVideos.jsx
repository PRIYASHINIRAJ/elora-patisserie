import { useEffect, useRef, useState } from 'react';
import { UploadCloud, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { studioVideoService } from '../services/studioVideoService';

export default function AdminStudioVideos() {
  const [videos, setVideos] = useState(null);
  const [caption, setCaption] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const load = () => {
    studioVideoService.adminList().then((d) => setVideos(d.videos)).catch(() => setError('Could not load videos.'));
  };

  useEffect(load, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Choose a video file first.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await studioVideoService.adminCreate(file, { caption, tiktokUrl });
      setCaption('');
      setTiktokUrl('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (video) => {
    await studioVideoService.adminUpdate(video.id, { isActive: video.is_active ? false : true });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    await studioVideoService.adminDelete(id);
    load();
  };

  return (
    <div className="px-8 py-10 lg:px-12">
      <h1 className="font-display text-4xl text-espresso mb-2">Studio Reels</h1>
      <p className="text-sm text-espresso/50 mb-8 max-w-xl">
        Short vertical videos shown in the "From the Studio" section on the homepage.
        Upload the video file directly — link to the original TikTok post if you'd like a
        "view on TikTok" button on the card.
      </p>

      <form onSubmit={handleUpload} className="bg-white border border-espresso/10 p-6 mb-10 max-w-xl space-y-4">
        <label className="border border-dashed border-espresso/25 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gold text-espresso/50 text-xs">
          <UploadCloud size={22} className="mb-2" />
          {file ? file.name : 'Choose a video file (mp4, mov)'}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        <div>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Caption</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Piping the sugar florals for a wedding order"
            className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">
            TikTok link <span className="normal-case text-espresso/30">(optional)</span>
          </label>
          <input
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@elorapatisserie/video/..."
            className="w-full border border-espresso/20 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="bg-espresso text-champagne px-6 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Add Video'}
        </button>
      </form>

      {!videos ? (
        <p className="text-espresso/50 text-sm">Loading…</p>
      ) : videos.length === 0 ? (
        <div className="border border-dashed border-espresso/20 bg-white p-12 text-center max-w-xl">
          <p className="text-espresso/60 text-sm">No videos yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 max-w-4xl">
          {videos.map((video) => (
            <div key={video.id} className="bg-white border border-espresso/10 overflow-hidden group relative">
              <div className="aspect-[9/16] bg-beige">
                <video src={video.video_url} muted loop className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <p className="text-[11px] truncate text-espresso/60">{video.caption || 'Untitled'}</p>
                <p className={`text-[10px] ${video.is_active ? 'text-green-700' : 'text-espresso/40'}`}>
                  {video.is_active ? 'Live on site' : 'Hidden'}
                </p>
              </div>
              <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {video.tiktok_url && (
                  <a
                    href={video.tiktok_url}
                    target="_blank"
                    rel="noreferrer"
                    title="View on TikTok"
                    className="w-7 h-7 bg-espresso/80 text-champagne rounded-full flex items-center justify-center hover:bg-espresso"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
                <button
                  onClick={() => toggleActive(video)}
                  title={video.is_active ? 'Hide from site' : 'Show on site'}
                  className="w-7 h-7 bg-espresso/80 text-champagne rounded-full flex items-center justify-center hover:bg-espresso"
                >
                  {video.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  title="Delete"
                  className="w-7 h-7 bg-espresso/80 text-champagne rounded-full flex items-center justify-center hover:bg-red-700"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
