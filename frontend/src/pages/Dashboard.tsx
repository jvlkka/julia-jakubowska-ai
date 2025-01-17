import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { SparklesIcon } from '@heroicons/react/24/outline'
import HeroSection from '../components/HeroSection'

type Step = 'ideas' | 'title' | 'thumbnail' | 'hook' | 'content';
type Tone = 'engaging' | 'professional' | 'funny' | 'educational' | 'dramatic' | 'casual';
type Language = 'English' | 'Polish';

interface GeneratedContent {
  ideas?: string[];
  selectedIdea?: string;
  title?: string[];
  selectedTitle?: string;
  thumbnail?: string[];
  selectedThumbnail?: string;
  hook?: string[];
  selectedHook?: string;
}

interface ApiResponse {
  status: string;
  ideas?: string[];
  titles?: string[];
  thumbnail_texts?: string[];
  hooks?: string[];
  error?: string;
}

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState<Step>('ideas');
  const [content, setContent] = useState<GeneratedContent>({});
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<Tone>('engaging')
  const [language, setLanguage] = useState<Language>('English')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null);

  const tones: Tone[] = ['engaging', 'professional', 'funny', 'educational', 'dramatic', 'casual'];

  type ContentType = 'ideas' | 'title' | 'thumbnail' | 'hook';
  
  const handleSelection = (type: ContentType, item: string) => {
    const key = `selected${type.charAt(0).toUpperCase() + type.slice(1)}` as const;
    setContent(prev => ({
      ...prev,
      [key]: item
    }));
  };

  const renderOptions = (
    items: string[] | undefined,
    type: ContentType,
    selectedItem?: string
  ) => {
    if (!items) return null;
    return (
      <div className="grid grid-cols-1 gap-6 mt-8">
        {items.map((item, index) => (
          <motion.button
            key={index}
            className={`p-6 rounded-2xl border-2 text-left text-xl ${
              selectedItem === item
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 hover:border-purple-300 dark:border-gray-700'
            }`}
            onClick={() => handleSelection(type, item)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {item}
          </motion.button>
        ))}
      </div>
    );
  };

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);

    const API_URL = import.meta.env.VITE_API_URL;

    try {
      let response: { data: ApiResponse };
      
      switch (currentStep) {
        case 'ideas':
          response = await axios.post(`${API_URL}/generate-ideas`, {
            topic,
            tone,
            language
          });
          if (response.data.ideas) {
            setContent(prev => ({ ...prev, ideas: response.data.ideas }));
          }
          break;

        case 'title':
          if (!content.selectedIdea) {
            throw new Error('Please select an idea first');
          }
          response = await axios.post(`${API_URL}/generate-title`, {
            idea: content.selectedIdea,
            tone,
            language
          });
          if (response.data.titles) {
            setContent(prev => ({ ...prev, title: response.data.titles }));
          }
          break;

        case 'thumbnail':
          if (!content.selectedTitle) {
            throw new Error('Please select a title first');
          }
          response = await axios.post(`${API_URL}/generate-thumbnail`, {
            title: content.selectedTitle,
            tone,
            language
          });
          if (response.data.thumbnail_texts) {
            setContent(prev => ({ ...prev, thumbnail: response.data.thumbnail_texts }));
          }
          break;

        case 'hook':
          if (!content.selectedTitle) {
            throw new Error('Please select a title first');
          }
          response = await axios.post(`${API_URL}/generate-hook`, {
            title: content.selectedTitle,
            tone,
            language
          });
          if (response.data.hooks) {
            setContent(prev => ({ ...prev, hook: response.data.hooks }));
          }
          break;
      }

      // Move to next step if generation was successful
      const steps: Step[] = ['ideas', 'title', 'thumbnail', 'hook', 'content'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }

    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          setError(
            language === 'English' 
              ? 'OpenAI rate limit reached. Please wait a minute before trying again.'
              : 'Limit OpenAI osiągnięty. Poczekaj minutę przed ponowną próbą.'
          );
        } else {
          setError(
            language === 'English'
              ? 'An error occurred. Please try again.'
              : 'Wystąpił błąd. Spróbuj ponownie.'
          );
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'ideas':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={language === 'English' ? 'Enter your topic' : 'Wpisz swój temat'}
                className="w-full p-6 text-2xl rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
              {renderOptions(content.ideas, 'ideas', content.selectedIdea)}
            </div>
          </div>
        );

      case 'title':
        return renderOptions(content.title, 'title', content.selectedTitle);

      case 'thumbnail':
        return renderOptions(content.thumbnail, 'thumbnail', content.selectedThumbnail);

      case 'hook':
        return renderOptions(content.hook, 'hook', content.selectedHook);

      case 'content':
        return (
          <div className="space-y-8 p-8 rounded-2xl border-2 border-gray-200">
            <h3 className="text-3xl font-bold">
              {language === 'English' ? 'Your Content Summary' : 'Podsumowanie Treści'}
            </h3>
            <div className="space-y-4">
              <p className="text-xl"><strong>{language === 'English' ? 'Selected Idea' : 'Wybrany Pomysł'}:</strong> {content.selectedIdea}</p>
              <p className="text-xl"><strong>{language === 'English' ? 'Title' : 'Tytuł'}:</strong> {content.selectedTitle}</p>
              <p className="text-xl"><strong>{language === 'English' ? 'Thumbnail Text' : 'Tekst Miniatury'}:</strong> {content.selectedThumbnail}</p>
              <p className="text-xl"><strong>{language === 'English' ? 'Hook' : 'Wstęp'}:</strong> {content.selectedHook}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      <div className="fixed inset-0 w-full h-full">
        <div 
          className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-50"
          style={{ backgroundSize: '150px 150px' }}
        />
      </div>
      
      <div className="relative z-10 min-h-screen">
        <HeroSection />
        
        <div className="container mx-auto px-8 py-24 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-6xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
              Video Creator
            </h2>
            <p className="text-2xl text-purple-200 max-w-4xl mx-auto mb-3">
              Create Engaging YouTube Content with AI
            </p>
            <p className="text-xl text-purple-300 italic">
              Twórz Angażujące Treści na YouTube z AI
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-purple-900/30 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border-2 border-purple-500/20"
            >
              <div className="space-y-8">
                <div className="flex items-center space-x-6 mb-12">
                  <SparklesIcon className="h-12 w-12 text-purple-400" />
                  <div>
                    <h3 className="text-4xl font-bold text-white">Step {currentStep === 'ideas' ? '1' : currentStep === 'title' ? '2' : currentStep === 'thumbnail' ? '3' : currentStep === 'hook' ? '4' : '5'}</h3>
                    <p className="text-2xl text-purple-300 italic">
                      {currentStep === 'ideas' ? 'Generate Ideas / Generuj Pomysły' :
                       currentStep === 'title' ? 'Choose Title / Wybierz Tytuł' :
                       currentStep === 'thumbnail' ? 'Select Thumbnail / Wybierz Miniaturę' :
                       currentStep === 'hook' ? 'Pick Hook / Wybierz Hook' :
                       'Review Content / Przejrzyj Treść'}
                    </p>
                  </div>
                </div>

                {renderCurrentStep()}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full p-6 text-2xl rounded-2xl bg-purple-500 hover:bg-purple-600 disabled:bg-purple-800 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1"
                >
                  {isLoading ? 'Generating...' : 'Generate'}
                </motion.button>

                {error && (
                  <p className="text-red-500">{error}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
