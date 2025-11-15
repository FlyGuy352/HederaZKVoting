"use client";

import dynamic from "next/dynamic";
 
const NoSSR = dynamic(() => import("./noSSR"), { ssr: false });
 
export default function Home() {
  return (
    <div>
      <NoSSR />
    </div>
  )
};