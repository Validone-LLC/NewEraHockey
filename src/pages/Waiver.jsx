import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiChevronRight, HiExclamationCircle } from 'react-icons/hi';
import Card from '@components/common/Card/Card';
import SEO from '@components/common/SEO/SEO';

const waiverData = {
  lastUpdated: 'January 2026',
  sections: [
    {
      id: 'acknowledgment',
      title: 'Acknowledgment of Risk',
      content: [
        'Hockey is an inherently physical and demanding sport that involves significant risks of injury, including but not limited to: collisions with other players, contact with the boards or ice surface, falls, equipment-related injuries, and exposure to flying pucks or sticks.',
        'By participating in New Era Hockey training programs, camps, events, or any hockey-related activities, you (or your child, if a minor) acknowledge and fully understand these inherent risks associated with the sport of hockey.',
        'You acknowledge that injuries may range from minor bruises and strains to more serious injuries including concussions, broken bones, dental injuries, ligament damage, and in rare cases, catastrophic or permanent injuries.',
        'Despite the best efforts of our qualified coaches and staff to provide a safe training environment, these risks cannot be completely eliminated due to the nature of the sport.',
      ],
    },
    {
      id: 'assumption-of-risk',
      title: 'Voluntary Assumption of Risk',
      content: [
        'You voluntarily choose to participate in New Era Hockey activities with full knowledge and appreciation of the risks involved.',
        'You assume all risks associated with participation, whether foreseen or unforeseen, known or unknown, and whether occurring before, during, or after training sessions.',
        'This assumption of risk includes but is not limited to: physical contact with other participants, impact with hockey equipment, facility conditions, travel to and from training locations, and any activities directly or indirectly related to New Era Hockey programs.',
        'You understand that New Era Hockey coaches and staff will make reasonable efforts to minimize risks but cannot guarantee participant safety or prevent all injuries.',
      ],
    },
    {
      id: 'medical-insurance',
      title: 'Medical Insurance and Treatment',
      content: [
        'All participants must maintain adequate health and medical insurance coverage that covers hockey-related injuries and activities.',
        'You acknowledge that New Era Hockey does not provide medical, health, or accident insurance for participants and is not responsible for any medical expenses incurred as a result of injuries sustained during participation.',
        'In the event of an injury requiring medical attention, you authorize New Era Hockey staff to secure emergency medical treatment if a parent or guardian cannot be immediately contacted.',
        'You agree to be financially responsible for any medical expenses incurred as a result of participation in New Era Hockey activities, including but not limited to emergency treatment, hospitalization, physical therapy, or ongoing medical care.',
      ],
    },
    {
      id: 'release-of-liability',
      title: 'Release and Waiver of Liability',
      content: [
        'To the fullest extent permitted by law, you hereby release, waive, discharge, and covenant not to sue New Era Hockey, its owner (Coach William Pasko), employees, coaches, contractors, affiliates, agents, and representatives (collectively, the "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury, including death, that may be sustained by you or your property while participating in New Era Hockey activities.',
        'This release applies to all claims, whether caused by the negligence of the Released Parties or otherwise, except for claims arising from gross negligence, willful misconduct, or intentional acts.',
        'You agree not to bring any legal action or lawsuit against the Released Parties for injuries or damages arising from participation in hockey activities.',
        'This release is intended to be as broad and inclusive as permitted by the laws of the Commonwealth of Virginia and the District of Columbia, and shall apply to all activities conducted by New Era Hockey in any location within the DMV area.',
      ],
    },
    {
      id: 'indemnification',
      title: 'Indemnification and Hold Harmless',
      content: [
        "You agree to indemnify, defend, and hold harmless the Released Parties from and against any and all claims, liabilities, damages, losses, costs, expenses (including reasonable attorney's fees), or causes of action arising from or related to your participation in New Era Hockey activities.",
        'This indemnification includes, but is not limited to, claims brought by third parties for injuries or damages allegedly caused by your actions, conduct, or participation in training activities.',
        'You agree to reimburse New Era Hockey for any costs, including legal fees, incurred in defending against claims arising from your participation or the participation of your child.',
        'This indemnification obligation shall survive the termination of your participation in New Era Hockey programs.',
      ],
    },
    {
      id: 'medical-disclosure',
      title: 'Medical Conditions and Physical Limitations',
      content: [
        'You are required to disclose any and all medical conditions, injuries, physical limitations, allergies, medications, or health concerns that may affect your ability to safely participate in hockey training activities.',
        'You certify that you (or your child) are in good physical condition and have no medical conditions that would prevent safe participation in strenuous physical activity, or have received clearance from a physician to participate despite any existing conditions.',
        'You agree to immediately notify New Era Hockey coaches if any medical condition, injury, or physical limitation develops or changes during your participation in programs.',
        'Failure to disclose relevant medical information may result in dismissal from programs without refund and may void this waiver and release of liability.',
      ],
    },
    {
      id: 'equipment-safety',
      title: 'Equipment and Safety Requirements',
      content: [
        'You acknowledge that proper safety equipment is essential for hockey participation and agree to wear appropriate, properly-fitted protective gear including helmet, gloves, skates, shin guards, elbow pads, shoulder pads, and any other equipment required by the facility or training activity.',
        'You are responsible for ensuring that all personal equipment is in good condition, properly maintained, and meets current safety standards. Coaches reserve the right to refuse participation if equipment is deemed unsafe or inadequate.',
        'New Era Hockey is not responsible for lost, stolen, damaged, or defective personal equipment. You assume all risk related to equipment failure or malfunction.',
        'You agree to follow all safety protocols, facility rules, and coach instructions regarding equipment usage, ice conditions, and training activities.',
        'You understand that failure to wear required safety equipment or follow safety guidelines may result in removal from training sessions without refund and may void liability protections under this waiver.',
      ],
    },
    {
      id: 'behavioral-standards',
      title: 'Conduct and Behavioral Standards',
      content: [
        'You agree to conduct yourself (or ensure your child conducts themselves) in a respectful, professional, and sportsmanlike manner at all times during New Era Hockey activities.',
        'Aggressive, abusive, threatening, or unsafe behavior toward coaches, staff, other participants, or facility personnel will not be tolerated and may result in immediate dismissal from programs without refund.',
        'You agree to follow all instructions from New Era Hockey coaches and staff regarding training activities, safety procedures, and facility usage.',
        'Violation of behavioral standards may result in termination of participation in current and future programs, with no refund of fees paid, and does not void or limit the liability waiver contained herein.',
      ],
    },
    {
      id: 'photo-video-consent',
      title: 'Photography, Video, and Media Release',
      content: [
        'You acknowledge that New Era Hockey may photograph, video record, or otherwise document training sessions for promotional, educational, social media, marketing, or administrative purposes.',
        'By participating in New Era Hockey activities, you grant permission for your image, likeness, and voice (or that of your child) to be used in photographs, videos, social media posts, website content, marketing materials, and other promotional content without compensation.',
        'You waive any rights to review, approve, or receive compensation for the use of such media and release New Era Hockey from any claims related to the use of your image or likeness.',
        'If you wish to opt out of media usage, you must provide written notice to New Era Hockey. This opt-out does not affect participation in programs but limits use of identifiable images in public-facing materials.',
      ],
    },
    {
      id: 'facility-risks',
      title: 'Facility and Environmental Conditions',
      content: [
        'You acknowledge that ice rinks and training facilities present unique environmental hazards including cold temperatures, hard surfaces, slippery conditions, boards, glass, benches, and other obstacles.',
        'New Era Hockey utilizes third-party facilities and is not responsible for facility conditions, maintenance issues, equipment failures, or other facility-related hazards beyond its reasonable control.',
        'You assume all risks related to facility conditions and environmental factors, including travel to and from training locations, parking lot conditions, and activities outside of direct training supervision.',
        'You agree to inspect facilities and training areas for obvious hazards and report safety concerns to coaches or facility management immediately.',
      ],
    },
    {
      id: 'covid-communicable',
      title: 'Communicable Diseases and Illness',
      content: [
        'You acknowledge that participation in group activities and shared facility usage may expose you to communicable diseases, viruses, bacteria, and other illnesses including but not limited to COVID-19, influenza, and other infectious diseases.',
        'You assume all risks related to exposure to communicable diseases and agree that New Era Hockey is not liable for any illness contracted during participation in programs or activities.',
        'You agree not to participate in training activities if you are experiencing symptoms of illness, have been exposed to contagious diseases, or have been advised by medical professionals to avoid group activities.',
        'You agree to follow any health screening, sanitization, or safety protocols implemented by New Era Hockey or facility management to reduce disease transmission.',
      ],
    },
    {
      id: 'minors-guardians',
      title: 'Minors and Parental/Guardian Consent',
      content: [
        'If the participant is under 18 years of age, a parent or legal guardian must review, agree to, and acknowledge this waiver on behalf of the minor participant.',
        'The parent or guardian represents and warrants that they have legal authority to bind the minor to the terms of this waiver and release.',
        'Parents and guardians assume all risks on behalf of their minor children and agree to the same terms, conditions, and liability releases as if they were the participating party.',
        "Parents and guardians agree to supervise their children before and after training sessions and acknowledge that New Era Hockey's responsibility begins and ends with the scheduled training time.",
      ],
    },
    {
      id: 'severability',
      title: 'Severability and Governing Law',
      content: [
        'If any provision of this waiver is found to be unenforceable or invalid by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.',
        'This waiver shall be governed by and construed in accordance with the laws of the Commonwealth of Virginia without regard to conflicts of law principles.',
        'Any legal action or proceeding arising from or related to this waiver or participation in New Era Hockey activities shall be brought exclusively in the courts of Virginia or the District of Columbia, and you consent to the jurisdiction of such courts.',
        'This waiver represents the entire agreement between you and New Era Hockey regarding liability and risk assumption and supersedes any prior oral or written agreements.',
      ],
    },
    {
      id: 'acknowledgment-signature',
      title: 'Acknowledgment and Understanding',
      content: [
        'By participating in New Era Hockey services, you acknowledge that you have read this entire waiver and release, fully understand its contents, and acknowledge that this is a release of liability and a contract between you and New Era Hockey.',
        'You acknowledge that this waiver is effective for all current and future participation in New Era Hockey programs unless explicitly revoked in writing.',
        'You confirm that you are voluntarily participating in New Era Hockey activities and that no one has made any representations or promises to you that are contrary to the terms of this waiver.',
        'You understand that New Era Hockey has given you the opportunity to ask questions about this waiver and to seek independent legal counsel before participating, and you have chosen to participate with full knowledge of the risks and legal consequences.',
        'This waiver is binding upon your heirs, executors, administrators, and assigns and shall survive the termination of your participation in New Era Hockey programs.',
      ],
    },
  ],
};

const Waiver = () => {
  const [activeSection, setActiveSection] = useState(null);

  const scrollToSection = sectionId => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <SEO pageKey="waiver" />
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-orange-500/10 border border-orange-500/30 rounded-full">
                <HiExclamationCircle className="w-6 h-6 text-orange-500" />
                <span className="text-orange-400 font-semibold">Important Legal Notice</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
                <span className="gradient-text">LIABILITY WAIVER</span>
              </h1>
              <p className="text-xl text-neutral-light max-w-3xl mx-auto">
                Release of Liability, Assumption of Risk, and Indemnity Agreement
              </p>
              <p className="text-sm text-neutral-text mt-4">
                Last Updated: {waiverData.lastUpdated}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
              <div className="flex items-start gap-4">
                <HiExclamationCircle className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Please Read Carefully</h3>
                  <p className="text-neutral-light leading-relaxed mb-3">
                    By participating in New Era Hockey training programs, camps, events, or any
                    hockey-related activities, you acknowledge and agree to the terms of this
                    Liability Waiver. This is a legally binding agreement that affects your legal
                    rights.
                  </p>
                  <p className="text-sm text-orange-400 font-semibold">
                    This waiver includes a release of liability, assumption of risk, and
                    indemnification provisions. If you do not agree to these terms, you may not
                    participate in New Era Hockey activities.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Content */}
        <section className="section-container">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="lg:sticky lg:top-24">
                <Card>
                  <h2 className="text-xl font-display font-bold text-white mb-4">
                    Table of Contents
                  </h2>
                  <nav className="space-y-2">
                    {waiverData.sections.map((section, index) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start gap-2 group ${
                          activeSection === section.id
                            ? 'bg-primary-light text-white'
                            : 'text-neutral-light hover:text-white hover:bg-primary-light/50'
                        }`}
                      >
                        <span className="text-teal-500 font-semibold flex-shrink-0">
                          {index + 1}.
                        </span>
                        <span className="text-sm flex-1">{section.title}</span>
                        <HiChevronRight
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${
                            activeSection === section.id ? 'text-teal-500' : 'text-neutral-dark'
                          } group-hover:translate-x-1`}
                        />
                      </button>
                    ))}
                  </nav>

                  {/* Quick Info */}
                  <div className="mt-6 p-4 bg-primary-light rounded-lg">
                    <h3 className="text-sm font-semibold text-white mb-2">Need Help?</h3>
                    <p className="text-xs text-neutral-light mb-3">Questions about this waiver?</p>
                    <Link
                      to="/contact"
                      className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                    >
                      Contact Us
                      <HiChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              </div>
            </motion.div>

            {/* Waiver Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3 space-y-8"
            >
              {waiverData.sections.map((section, index) => (
                <div key={section.id} id={section.id}>
                  <Card>
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-3xl font-bold text-teal-500">{index + 1}</span>
                      <h2 className="text-2xl font-display font-bold text-white pt-1">
                        {section.title}
                      </h2>
                    </div>
                    <div className="space-y-4 ml-12">
                      {section.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-neutral-light leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}

              {/* Back to Top */}
              <div className="text-center pt-8">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 text-teal-500 hover:text-teal-400 transition-colors font-semibold"
                >
                  Back to Top
                  <HiChevronRight className="w-4 h-4 rotate-[-90deg]" />
                </button>
              </div>

              {/* Contact Card */}
              <Card>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-3">Questions or Concerns?</h3>
                  <p className="text-neutral-light mb-4 max-w-2xl mx-auto">
                    If you have questions about this waiver or need clarification on any terms,
                    please contact us before participating in New Era Hockey activities.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Link
                      to="/contact"
                      className="inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all"
                    >
                      Contact Us
                    </Link>
                    <Link
                      to="/terms-and-conditions"
                      className="inline-block px-6 py-3 bg-primary-light text-white font-semibold rounded-lg hover:bg-primary transition-all"
                    >
                      View Terms & Conditions
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Waiver;
