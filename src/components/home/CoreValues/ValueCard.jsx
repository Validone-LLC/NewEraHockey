import Card from '@components/common/Card/Card';

const ValueCard = ({ value, index }) => {
  return (
    <Card delay={index * 0.2} hover={false}>
      <div className="text-center">
        {/* Icon with gradient background */}
        <div
          className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${value.gradient}
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
    </Card>
  );
};

export default ValueCard;
