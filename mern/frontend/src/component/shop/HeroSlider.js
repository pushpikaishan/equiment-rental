import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSlider = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // You can add your own images here
  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&q=80', // Basketball court
      title: 'Premium Event Equipment',
      subtitle: 'GET UP TO 50% OFF',
      description: 'Book your favorite event gear today',
      buttonText: 'BOOK NOW'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80', // Event setup
      title: 'Event Equipment Rental',
      subtitle: 'SPECIAL OFFERS',
      description: 'Everything you need for your perfect event',
      buttonText: 'BOOK NOW'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1920&q=80', // Audio equipment
      title: 'Audio & Lighting',
      subtitle: 'PROFESSIONAL GRADE',
      description: 'Premium quality equipment for any occasion',
      buttonText: 'BOOK NOW'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleBookNow = () => {
    // Scroll to equipment list smoothly
    const equipmentSection = document.getElementById('inventory-list') || document.querySelector('[data-equipment-list]');
    if (equipmentSection) {
      equipmentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // If not on home page, navigate to home with hash so list scrolls on mount
      navigate('/home#inventory-list');
    }
  };

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '750px',
    overflow: 'hidden',
    background: '#000',
    marginTop: 0
  };

  const slideWrapperStyle = {
    display: 'flex',
    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: `translateX(-${currentSlide * 100}%)`,
    height: '100%'
  };

  const slideStyle = {
    minWidth: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const imageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    animation: 'zoomIn 5s ease-out forwards'
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.75) 50%, rgba(51,65,85,0.85) 100%)',
    zIndex: 1
  };

  const contentWrapperStyle = {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    color: '#ffffff',
    maxWidth: '1200px',
    padding: '0 40px',
    animation: 'fadeInUp 1s ease-out forwards'
  };

  const subtitleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '4px',
    marginBottom: '16px',
    color: '#ffffff',
    textTransform: 'uppercase',
    animation: 'fadeInDown 0.8s ease-out 0.2s forwards',
    opacity: 0
  };

  const titleStyle = {
    fontSize: '72px',
    fontWeight: 800,
    marginBottom: '20px',
    letterSpacing: '-2px',
    lineHeight: 1.1,
    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
    animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
    opacity: 0
  };

  const descriptionStyle = {
    fontSize: '20px',
    fontWeight: 400,
    marginBottom: '40px',
    maxWidth: '700px',
    margin: '0 auto 40px',
    animation: 'fadeInUp 0.8s ease-out 0.6s forwards',
    opacity: 0.95
  };

  const buttonStyle = {
    padding: '18px 50px',
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '2px',
    border: 'none',
    borderRadius: '50px',
    background: '#ffffff',
    color: '#2563eb',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'uppercase',
    boxShadow: '0 10px 30px rgba(255, 255, 255, 0.3)',
    animation: 'fadeInUp 0.8s ease-out 0.8s forwards, pulse 2s ease-in-out 2s infinite',
    opacity: 0
  };

  const dotsContainerStyle = {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    zIndex: 20
  };

  const dotStyle = (isActive) => ({
    width: isActive ? '50px' : '15px',
    height: '15px',
    borderRadius: '10px',
    background: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    boxShadow: isActive ? '0 0 20px rgba(255, 255, 255, 0.6)' : 'none'
  });

  const navigationButtonStyle = (direction) => ({
    position: 'absolute',
    top: '50%',
    [direction]: '30px',
    transform: 'translateY(-50%)',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    zIndex: 20,
    backdropFilter: 'blur(10px)'
  });

  // Add keyframe animations via style tag
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        margin: 0;
        padding: 0;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes zoomIn {
        from {
          transform: scale(1.1);
        }
        to {
          transform: scale(1);
        }
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={containerStyle}>
      <div style={slideWrapperStyle}>
        {slides.map((slide, index) => (
          <div key={slide.id} style={slideStyle}>
            <img 
              src={slide.image} 
              alt={slide.title}
              style={imageStyle}
            />
            <div style={overlayStyle}></div>
            <div style={contentWrapperStyle}>
              <div style={subtitleStyle}>{slide.subtitle}</div>
              <h1 style={titleStyle}>{slide.title}</h1>
              <p style={descriptionStyle}>{slide.description}</p>
              <button 
                style={buttonStyle}
                onClick={handleBookNow}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(37, 99, 235, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 255, 255, 0.3)';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(37, 99, 235, 0.6)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 255, 255, 0.3)';
                }}
              >
                {slide.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        style={navigationButtonStyle('left')}
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        onMouseOver={(e) => { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.borderColor = '#ffffff';
        }}
        onMouseOut={(e) => { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }}
        onFocus={(e) => { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.borderColor = '#ffffff';
        }}
        onBlur={(e) => { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }}
        aria-label="Previous slide"
      >
        ‹
      </button>

      <button
        style={navigationButtonStyle('right')}
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        onMouseOver={(e) => { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.borderColor = '#ffffff';
        }}
        onMouseOut={(e) => { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }}
        onFocus={(e) => { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.borderColor = '#ffffff';
        }}
        onBlur={(e) => { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }}
        aria-label="Next slide"
      >
        ›
      </button>

      <div style={dotsContainerStyle}>
        {slides.map((_, index) => (
          <button
            key={index}
            style={dotStyle(index === currentSlide)}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
