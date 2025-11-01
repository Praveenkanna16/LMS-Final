import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CTA = () => {
  return (
    <section className='py-20 px-4 bg-gradient-to-br from-primary/20 via-background to-accent/20'>
      <div className='container mx-auto'>
        <div className='max-w-4xl mx-auto text-center space-y-8'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/20'>
            <Sparkles className='w-4 h-4 text-accent' />
            <span className='text-sm'>Start Your Journey Today</span>
          </div>

          <h2 className='text-4xl md:text-5xl font-bold'>
            Ready to Level Up Your
            <span className='block mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'>
              Developer Career?
            </span>
          </h2>

          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Join thousands of developers who are already learning, building, and advancing their
            careers with our platform.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-4'>
            <Button variant='hero' size='lg'>
              Get Started Free
              <ArrowRight className='w-5 h-5' />
            </Button>
            <Button variant='glass' size='lg'>
              Schedule a Demo
            </Button>
          </div>

          <p className='text-sm text-muted-foreground'>
            No credit card required • Free tier forever • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};
