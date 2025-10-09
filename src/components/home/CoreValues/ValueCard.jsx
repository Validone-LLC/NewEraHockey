import Card from '@components/common/Card/Card';

const ValueCard = ({ value, index }) => {
  return (
    <Card delay={index * 0.2} hover={false}>
      <div className="relative overflow-hidden rounded-lg">
        {/* Background Image */}
        {value.image && (
          <div className="absolute inset-0 z-0">
            <img
              src={value.image}
              alt={`${value.title} background`}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-bg/80 to-neutral-bg" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Icon with gradient background */}
          <div
            className={`w-20 h-20 mx-auto mb-6 mt-2 rounded-full bg-gradient-to-br ${value.gradient}
              flex items-center justify-center shadow`}
          >
            <value.icon className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-display font-bold text-white mb-4">
            {value.title}
          </h3>

          {/* Description */}
          <p className="text-neutral-light leading-relaxed">
            {value.description}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ValueCard;
