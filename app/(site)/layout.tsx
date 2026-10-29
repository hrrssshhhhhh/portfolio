import Footer from "@/components/Footer";
import Header from "@/components/Header";

// Site frame for every page except /play, where the game takes the whole screen.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
