'use client';

import React from "react";
import Giscus from "@giscus/react";

function GiscusComments({ lang }) {
  return (
    <Giscus
      repo="yiGmMk/comment_blog"
      repoId="MDEwOlJlcG9zaXRvcnkxOTcyMTY4NDA="
      category="Announcements"
      categoryId="DIC_kwDOC8FKSM4CAcFc"
      mapping="pathname"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme="light"
      lang={lang}
    />
  );
}

const langMap = {
  zh: "zh-CN",
  en: "en",
};

export default function CommonComments({ lang }) {
  return (
    <div className="mt-8">
      <GiscusComments lang={langMap[lang] || "en"} />
    </div>
  );
}