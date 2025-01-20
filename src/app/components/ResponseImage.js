import Image from 'next/image';

const getImageUrl = (src, size) => {
  const parsedUrl = new URL(src, 'https://games.programnotes.cn');
  const query = parsedUrl.search.slice(1);
  if (query) {
    return `${parsedUrl.pathname}?${query}&w=${size}`;
  } else {
    return `${parsedUrl.pathname}?w=${size}`;
  }
};

const ResponsiveWebPImage = ({ src, alt, isGif = false }) => {
  if (isGif) {
    return (
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <Image
          src={src}
          alt={alt}
          layout="fill"
          objectFit="cover"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
      <Image
        src={getImageUrl(src, 1600)}
        alt={alt}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        srcSet={[
          { src: getImageUrl(src, 400), width: 400 },
          { src: getImageUrl(src, 800), width: 800 },
          { src: getImageUrl(src, 1600), width: 1600 },
        ]}
        layout="fill"
        objectFit="cover"
      />
    </div>
  );
};

ResponsiveWebPImage.displayName = 'ResponsiveWebPImage';

export default ResponsiveWebPImage;
