'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8" style={{
      background: 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #1a0033 100%)'
    }}>
      <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-gray-800 text-gray-200">
        <div className="mb-8">
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium text-sm flex items-center gap-1">
            ← Voltar para o Cadastro
          </Link>
          <h1 className="text-4xl font-bold mt-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Política de Privacidade
          </h1>
          <p className="text-gray-400 text-xs mt-2 font-mono">Última atualização: 21 de maio de 2026</p>
        </div>

        <div className="space-y-6 text-sm md:text-base leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">1. Introdução</h2>
            <p>
              A nossa plataforma valoriza a segurança e confidencialidade dos dados dos nossos utilizadores. Esta Política de Privacidade explica detalhadamente como coletamos, usamos, divulgamos e protegemos as suas informações pessoais quando utiliza os nossos serviços.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">2. Informações Que Coletamos</h2>
            <p>
              Para lhe fornecer os nossos serviços de entretenimento e apostas de forma segura, podemos coletar:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Detalhes da conta: nome completo, endereço de e-mail, data de nascimento e dados de contato.</li>
              <li>Dados de Verificação (KYC): documentos de identificação necessários para cumprir requisitos legais contra lavagem de dinheiro.</li>
              <li>Informações financeiras: transações de depósito, histórico de saques e métodos de pagamento.</li>
              <li>Dados de Uso: dados sobre as suas jogadas, apostas, preferências de jogos e navegação no site.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">3. Como Utilizamos os Seus Dados</h2>
            <p>
              Os seus dados são utilizados estritamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Processar as suas transações de depósito e retirada de forma segura.</li>
              <li>Verificar a sua identidade e prevenir qualquer atividade fraudulenta.</li>
              <li>Oferecer promoções e bônus personalizados de acordo com o seu perfil.</li>
              <li>Garantir o cumprimento estrito das regulações de jogos vigentes.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos nem alugamos os seus dados pessoais a terceiros. No entanto, as informações podem ser compartilhadas com provedores de serviços contratados (como intermediadores de pagamento e sistemas de auditoria de apostas) e com autoridades regulatórias em cumprimento de obrigações legais.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">5. Segurança das Informações</h2>
            <p>
              Implementamos protocolos avançados de criptografia de dados (passwords hashadas, conexões SSL protegidas e isolamento de banco de dados do usuário) para garantir que todas as transações e dados de conta permaneçam absolutamente privados e seguros.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">6. Contatos</h2>
            <p>
              Se você tiver alguma dúvida sobre a nossa Política de Privacidade ou precisar de assistência relacionada aos seus dados e direitos de privacidade, entre em contato conosco através do canal de suporte no aplicativo.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
