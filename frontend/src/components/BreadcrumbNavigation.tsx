import { Link } from 'react-router-dom';
import React, { Fragment } from 'react';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbItemProps {
  label: string;
  href?: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItemProps[];
  backButtonHref?: string;
  backButtonLabel?: string;
}

export default function BreadcrumbNavigation({ 
  items, 
  backButtonHref, 
  backButtonLabel = 'Back' 
}: BreadcrumbNavigationProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {backButtonHref ? (
                <BreadcrumbLink asChild>
                  <Link to={backButtonHref} className="flex items-center">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {backButtonLabel}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <span className="flex items-center text-muted-foreground">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {backButtonLabel}
                </span>
              )}
            </BreadcrumbItem>
            
            {items.map((item, index) => (
              <Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        
        {backButtonHref && (
          <div className="sm:hidden">
            <Button variant="ghost" size="sm" asChild>
              <Link to={backButtonHref}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {backButtonLabel}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}