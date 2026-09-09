'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, CheckCircle, Mail, Download, Sparkles } from 'lucide-react'

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const [showConfetti, setShowConfetti] = useState(false)

  const amount = searchParams.get('amount')
  const email = searchParams.get('email')
  const recurring = searchParams.get('recurring') === 'true'
  const orgName = searchParams.get('orgName')

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const formattedAmount = amount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(parseFloat(amount))
    : '$0.00'

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 ${
                  ['bg-primary-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'][
                    Math.floor(Math.random() * 5)
                  ]
                }`}
                style={{
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full space-y-8 animate-appear">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 relative">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          </div>

          <h1 className="text-4xl font-bold text-neutral-900 mb-3 heading-tight">
            Thank You for Your Generosity!
          </h1>

          <p className="text-xl text-neutral-600">
            Your donation has been successfully processed
          </p>
        </div>

        {/* Donation Details Card */}
        <Card className="shadow-md-soft border-green-200">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Amount */}
              <div className="border-b border-neutral-100 pb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Heart className="h-6 w-6 text-rose-500" />
                  <span className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                    {recurring ? 'Monthly Donation' : 'One-Time Donation'}
                  </span>
                </div>
                <div className="text-5xl font-bold text-primary-600 mb-1">
                  {formattedAmount}
                </div>
                {recurring && (
                  <p className="text-sm text-neutral-600">
                    Your recurring donation will be processed monthly
                  </p>
                )}
              </div>

              {/* Receipt Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-neutral-700">
                  <Mail className="h-5 w-5 text-primary-600" />
                  <p className="text-sm">
                    A receipt has been sent to{' '}
                    <span className="font-medium">{email || 'your email'}</span>
                  </p>
                </div>

                {orgName && (
                  <p className="text-sm text-neutral-600">
                    Supporting <span className="font-medium text-neutral-900">{orgName}</span>
                  </p>
                )}
              </div>

              {/* Impact Message */}
              <div className="bg-gradient-hero rounded-lg p-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">Your Impact</h3>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  Your generous contribution will help us continue our mission and make a
                  lasting difference in our community. Every donation, no matter the size,
                  brings us closer to our goals.
                </p>
              </div>

              {/* Tax Deductible Notice */}
              <div className="text-xs text-neutral-500 pt-4 border-t border-neutral-100">
                This donation may be tax-deductible. Please consult with your tax advisor
                and retain your receipt for your records.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>

          {orgName && (
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              asChild
            >
              <Link href="/">
                Return Home
              </Link>
            </Button>
          )}
        </div>

        {/* Social Sharing (Optional) */}
        <div className="text-center pt-8">
          <p className="text-sm text-neutral-600 mb-4">
            Help us spread the word about our mission
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" className="rounded-full">
              Share
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )
}
