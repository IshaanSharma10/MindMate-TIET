import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import avatarImage from "@/assets/avatar.png";

const Header = () => {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground text-background">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-lg font-bold">MindMate</span>
            <span className="text-accent">✦</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Button variant="ghost" className="font-medium hover:text-primary">
              Home
            </Button>
            <Button variant="ghost" className="font-medium hover:text-primary">
              Chat
            </Button>
            <Button variant="ghost" className="font-medium hover:text-primary">
              Insights
            </Button>
            <Button variant="ghost" className="font-medium hover:text-primary">
              Settings
            </Button>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <img
                src={avatarImage}
                alt="User avatar"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
