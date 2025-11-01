import { Code2, Github, Twitter, Linkedin, Youtube } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className='bg-secondary/30 border-t border-border'>
      <div className='container mx-auto px-4 py-12'>
        <div className='grid md:grid-cols-4 gap-8'>
          {/* Brand */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center'>
                <Code2 className='w-6 h-6 text-primary-foreground' />
              </div>
              <span className='text-xl font-bold'>GenZEd</span>
            </div>
            <p className='text-sm text-muted-foreground'>
              Empowering developers through interactive learning and real-world projects.
            </p>
            <div className='flex gap-4'>
              <a href='#' className='text-muted-foreground hover:text-primary transition-colors'>
                <Github className='w-5 h-5' />
              </a>
              <a href='#' className='text-muted-foreground hover:text-primary transition-colors'>
                <Twitter className='w-5 h-5' />
              </a>
              <a href='#' className='text-muted-foreground hover:text-primary transition-colors'>
                <Linkedin className='w-5 h-5' />
              </a>
              <a href='#' className='text-muted-foreground hover:text-primary transition-colors'>
                <Youtube className='w-5 h-5' />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className='font-semibold mb-4'>Platform</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Courses
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Learning Paths
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Projects
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Challenges
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className='font-semibold mb-4'>Community</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Forums
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Study Groups
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Events
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className='font-semibold mb-4'>Company</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  About
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Careers
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Privacy
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-primary transition-colors'>
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground'>
          <p>&copy; 2024 GenZEd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
