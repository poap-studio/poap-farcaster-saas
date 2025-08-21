/* eslint-disable @next/next/no-img-element */

export default function SocialBubbles() {
  const socials = [
    { name: 'Farcaster', icon: '/icons/farcaster.png', color: 'from-purple-500 to-purple-700' },
    { name: 'Telegram', icon: '/icons/telegram.png', color: 'from-blue-400 to-blue-600' },
    { name: 'Instagram', icon: '/icons/instagram.png', color: 'from-pink-500 to-orange-500' },
    { name: 'Lens', icon: '/icons/lens.png', color: 'from-green-500 to-green-700' },
    { name: 'X', icon: '/icons/x.png', color: 'from-gray-700 to-gray-900' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {socials.map((social) => (
        <div
          key={social.name}
          className="relative group"
        >
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${social.color} flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 cursor-pointer p-4`}>
            <img 
              src={social.icon} 
              alt={social.name}
              className="w-full h-full object-contain filter brightness-0 invert"
            />
          </div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-xs text-gray-400 whitespace-nowrap">{social.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}