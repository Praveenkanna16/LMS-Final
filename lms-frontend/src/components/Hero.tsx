import { Button } from '@/components/ui/button';
import { Code2, Rocket, Users } from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';

export const Hero = () => {
  return (
    <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
      {/* Gradient background */}
      <div className='absolute inset-0 bg-[var(--gradient-hero)]' />

      {/* Hero image overlay */}
      <div
        className='absolute inset-0 opacity-20'
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Animated gradient orbs */}
      <div className='absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse' />
      <div className='absolute bottom-20 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse delay-1000' />

      {/* Content */}
      <div className='relative z-10 container mx-auto px-4 py-20 text-center'>
        <div className='max-w-4xl mx-auto space-y-8'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 backdrop-blur-sm border border-primary/20'>
            <Rocket className='w-4 h-4 text-accent' />
            <span className='text-sm text-muted-foreground'>The Future of Developer Education</span>
          </div>

          <h1 className='text-5xl md:text-7xl font-bold leading-tight'>
            Master Code Through
            <span className='block mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'>
              Interactive Learning
            </span>
          </h1>

          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Build real-world projects, learn from industry experts, and accelerate your developer
            career with hands-on coding challenges and personalized learning paths.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            <Button variant='hero' size='lg'>
              <Code2 className='w-5 h-5' />
              Start Learning Free
            </Button>
            <Button variant='glass' size='lg'>
              <Users className='w-5 h-5' />
              Join 10K+ Developers
            </Button>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8'>
            <div>
              <div className='text-3xl font-bold text-primary'>500+</div>
              <div className='text-sm text-muted-foreground'>Courses</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-accent'>10K+</div>
              <div className='text-sm text-muted-foreground'>Students</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-primary'>95%</div>
              <div className='text-sm text-muted-foreground'>Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
