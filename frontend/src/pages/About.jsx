import { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  Target, 
  Heart, 
  Award, 
  BookOpen,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const About = () => {
  const [activeTab, setActiveTab] = useState('mission');

  const stats = [
    { number: '10,000+', label: 'Students Connected', icon: Users },
    { number: '2,500+', label: 'Expert Tutors', icon: GraduationCap },
    { number: '95%', label: 'Success Rate', icon: Target },
    { number: '50+', label: 'Subjects Covered', icon: BookOpen }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Student-Centric',
      description: 'Every decision we make puts student success and growth at the center.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We maintain the highest standards in education and mentor selection.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a supportive learning community that lasts beyond sessions.'
    },
    {
      icon: Target,
      title: 'Results-Driven',
      description: 'Focused on measurable outcomes and real skill development.'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Co-Founder',
      image: '/api/placeholder/150/150',
      bio: 'Former education director with 15+ years experience in personalized learning.',
      linkedin: '#'
    },
    {
      name: 'Michael Chen',
      role: 'CTO & Co-Founder',
      image: '/api/placeholder/150/150',
      bio: 'Tech entrepreneur passionate about using AI to enhance education.',
      linkedin: '#'
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Head of Education',
      image: '/api/placeholder/150/150',
      bio: 'PhD in Educational Psychology, specializing in adaptive learning methods.',
      linkedin: '#'
    },
    {
      name: 'David Kim',
      role: 'Head of Product',
      image: '/api/placeholder/150/150',
      bio: 'Product strategist focused on creating intuitive learning experiences.',
      linkedin: '#'
    }
  ];

  const achievements = [
    'Featured in TechCrunch as "EdTech Startup to Watch 2024"',
    'Winner of Global Education Innovation Award 2024',
    'Partnered with 200+ universities worldwide',
    'Achieved 95% student satisfaction rate',
    'Raised $10M Series A for education accessibility'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About <span className="text-yellow-400">LearingSphere</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-100">
              Empowering learners worldwide through personalized education and meaningful mentor connections
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center min-w-[150px]">
                  <stat.icon className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                  <div className="text-3xl font-bold">{stat.number}</div>
                  <div className="text-sm text-gray-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'mission', label: 'Our Mission' },
              { key: 'story', label: 'Our Story' },
              { key: 'values', label: 'Values' },
              { key: 'team', label: 'Team' },
              { key: 'achievements', label: 'Achievements' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Tab */}
        {activeTab === 'mission' && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                To democratize quality education by connecting passionate learners with expert mentors, 
                creating personalized learning experiences that unlock human potential regardless of 
                geographical or economic barriers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">What We Believe</h3>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">Every person deserves access to quality education</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">Personalized learning accelerates growth</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">Technology should enhance, not replace, human connection</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">Learning is a lifelong journey</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Impact</h3>
                <p className="text-gray-700 mb-6">
                  Since 2022, we've helped thousands of students achieve their learning goals through 
                  our innovative matching algorithm and supportive community.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                  <span>Join Our Mission</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Story Tab */}
        {activeTab === 'story' && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                From a college dorm room idea to a global education platform
              </p>
            </div>

            <div className="space-y-12">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">The Beginning (2022)</h3>
                    <p className="text-gray-700">
                      Founded by two college students who struggled to find quality tutors for advanced subjects. 
                      They realized that great mentors existed everywhere, but there was no easy way to connect 
                      with them. This sparked the idea for LearingSphere.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Early Growth (2023)</h3>
                    <p className="text-gray-700">
                      Launched our MVP with 50 tutors and 200 students. Word spread quickly through universities, 
                      and we realized we had tapped into a universal need. Students loved the personalized approach, 
                      and tutors appreciated the flexible platform.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Scaling Impact (2024)</h3>
                    <p className="text-gray-700">
                      Expanded internationally and introduced AI-powered matching. Partnered with universities 
                      and corporations for professional development programs. Our community grew to over 10,000 
                      active learners and 2,500 expert mentors.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl">
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">The Future (2025+)</h3>
                    <p className="text-gray-100">
                      We're building the world's most comprehensive personalized learning ecosystem. 
                      Our vision: every person having access to the perfect mentor for their learning journey, 
                      supported by cutting-edge technology and a thriving global community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Values Tab */}
        {activeTab === 'values' && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                      <value.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                      <p className="text-gray-700">{value.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Meet Our Team</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Passionate educators and technologists working to transform learning
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Connect on LinkedIn
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Achievements</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Milestones that mark our journey toward educational excellence
              </p>
            </div>

            <div className="space-y-6">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 hover:shadow-xl transition-shadow">
                  <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg text-gray-900">{achievement}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl text-center">
              <h3 className="text-2xl font-bold mb-4">Want to be part of our story?</h3>
              <p className="text-xl mb-6">
                Join thousands of learners and mentors who are already transforming education with us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                  Become a Mentor
                </button>
                <button className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                  Start Learning
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default About;