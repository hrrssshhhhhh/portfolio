import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import lostFox from "@/public/lost-fox.jpg";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky";

// 404 in the game's style. The picture is a still from the lab's LOST stage (/lab?k=LOST), so
// this page ships no 3D.
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-24 pt-40 md:pt-36">
        <Container>
          <div className="border-2 border-line shadow-[6px_6px_0_rgb(0_0_0/0.45)]">
            <Image src={lostFox} alt="The fox standing at the edge of a floating island where the path breaks off into the sky." priority placeholder="blur" className="h-auto w-full md:aspect-[16/7] md:object-cover" />
          </div>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-haze">Error 404 · Page not found</p>
          <h1 className="mt-3 font-display text-3xl leading-tight title-shadow sm:text-4xl md:text-6xl md:tracking-tight">You fell off the map</h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-haze">
            This path doesn&apos;t go anywhere. The link may be old, or the page has moved.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className={`inline-flex min-h-14 items-center border-2 border-night bg-sun px-6 font-bold text-night shadow-[5px_5px_0_var(--color-white)] transition-[box-shadow,translate] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-white)] ${focusRing}`}
            >
              Back home
            </Link>
            <Link href="/play" className={`inline-flex min-h-14 items-center border-2 border-sun px-6 font-bold text-sun transition-colors duration-150 hover:bg-sun hover:text-night ${focusRing}`}>
              Play the level
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
