'use client';

import Link from 'next/link';

export default function TermsPage() {
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
            Termos e Condições de Uso
          </h1>
          <p className="text-gray-400 text-xs mt-2 font-mono">Última atualização: 21 de maio de 2026</p>
        </div>

        <div className="space-y-6 text-sm md:text-base leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">1. Aceitação dos Termos</h2>
            <p>
              Ao registrar uma conta na nossa plataforma e participar de nossos jogos, você concorda formalmente em cumprir e estar vinculado a estes Termos e Condições de Uso. Se você não concordar com qualquer parte destes termos, não deverá acessar nem tentar utilizar nenhum dos nossos serviços.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">2. Requisitos de Elegibilidade</h2>
            <p>
              Para abrir uma conta e utilizar o nosso serviço, o utilizador deve obrigatoriamente cumprir as seguintes condições:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Ter pelo menos 18 anos de idade ou a idade de maioridade legal em sua jurisdição (o que for maior).</li>
              <li>Registrar uma conta com dados reais, completos e atualizados em seu próprio nome.</li>
              <li>Não residir em jurisdições onde o uso da plataforma de apostas de entretenimento seja proibido ou regulado negativamente.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">3. Registro de Conta e Segurança</h2>
            <p>
              O utilizador é responsável por manter a confidencialidade de sua senha e de todos os dados de acesso à sua conta. Qualquer atividade detectada e realizada sob as suas credenciais será considerada de autoria exclusiva do respectivo utilizador. Práticas de contas duplicadas, aluguel de contas ou partilha de logins não são permitidas e ensejarão banimento permanente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">4. Depósitos, Apostas e Saques</h2>
            <p>
              Todos os reembolsos, saldos, transações de bônus e saques seguem regras rigorosas:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Os depósitos devem provir de contas bancárias, cartões ou carteiras de titularidade idêntica à cadastrada na plataforma.</li>
              <li>O saldo promocional do bônus está sujeito a requisitos de rollover (meta de apostas cumulativas) antes de ser elegível para saque.</li>
              <li>Tentativas de fraude financeira ou depósitos suspeitos serão bloqueadas para fins de auditoria interna por até 180 dias.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">5. Jogo Responsável e Limitações</h2>
            <p>
              Apoiamos integralmente o Jogo Responsável. O utilizador pode, a qualquer momento nas definições de sua conta, solicitar limites de transações diárias ou autoexclusão temporária e definitiva de acordo com a sua preferência. Reservamos o direito de avaliar comportamentos e aplicar restrições protetivas proativamente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-purple-300">6. Rescisão e Encerramento de Contas</h2>
            <p>
              Temos o direito de suspender ou banir contas de utilizadores que violem flagrantemente as nossas regras, realizem abusos promocionais, explorem falhas de jogos ou de software, ou se comportem agressivamente nos nossos canais de suporte.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
