import Image from "next/image"
import Link from "next/link"
import DesktopLogo from "./../../public/Airbnb_Logosvg.png";
import MobileLogo from "./../../public/Airbnb_Logo_mobile.png";
import NavUser from "./NavUser";

const Navbar = () => {
  return (
    <div className="w-full border-b">
      <div className="flex justify-between items-center p-5 lg:px-10 container mx-auto">
        <Link href="/">
            <Image src={DesktopLogo} alt="Dekstop Logo" className="w-32 hidden lg:block" width={200} height={200}/>

            <Image src={MobileLogo} alt="Dekstop Logo" className="w-12 block lg:hidden" width={200} height={200}/>
        </Link>
        <div className="rounded-full border px-5 py-2">
            <h1>Hello From the search</h1>
        </div>
        <NavUser/>
      </div>
    </div>
  )
}

export default Navbar
